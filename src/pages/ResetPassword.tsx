import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, ArrowLeft, Lock, Loader2, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'otp' | 'password' | 'success'>('otp');
  const [email, setEmail] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get email from sessionStorage
    const savedEmail = sessionStorage.getItem('resetEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }

    // Check if user arrived via email link (with access_token in URL)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    if (accessToken) {
      // User clicked the email link, skip OTP and go to password
      setStep('password');
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter all 6 digits.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'recovery',
      });

      if (error) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect or expired. Please try again.",
          variant: "destructive",
        });
      } else {
        setStep('password');
        toast({
          title: "Code Verified!",
          description: "Now set your new password.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setStep('success');
        sessionStorage.removeItem('resetEmail');
        toast({
          title: "Password Updated!",
          description: "You can now sign in with your new password.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-border shadow-large animate-fade-in">
        <CardHeader className="text-center pb-2">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">AiZboostr</span>
          </Link>
          <CardTitle className="text-2xl font-bold">
            {step === 'otp' && 'Enter Verification Code'}
            {step === 'password' && 'Set New Password'}
            {step === 'success' && 'Password Reset!'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 'otp' && 'Enter the 6-digit code sent to your email'}
            {step === 'password' && 'Create a strong password for your account'}
            {step === 'success' && 'Your password has been successfully updated'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-bold input-focus"
                    />
                  ))}
                </div>
                {email && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Code sent to: {email}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full btn-gradient" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Verify Code
              </Button>
              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Resend Code
                </Link>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-focus"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-focus"
                />
              </div>
              <Button type="submit" className="w-full btn-gradient" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Reset Password
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-2" />
                <p className="text-sm text-foreground font-medium">
                  Your password has been reset successfully!
                </p>
              </div>
              <Button onClick={() => navigate('/auth')} className="w-full btn-gradient">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
