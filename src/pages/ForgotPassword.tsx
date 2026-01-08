import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setEmailSent(true);
        // Store email in sessionStorage for the reset page
        sessionStorage.setItem('resetEmail', email);
        toast({
          title: "OTP Sent!",
          description: "Check your email for the verification code.",
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

  const handleContinue = () => {
    navigate('/reset-password');
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
            {emailSent ? 'Check Your Email' : 'Forgot Password?'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {emailSent 
              ? 'We sent a 6-digit verification code to your email'
              : 'Enter your email and we\'ll send you a verification code'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-focus"
                />
              </div>
              <Button type="submit" className="w-full btn-gradient" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Verification Code
              </Button>
              <div className="text-center">
                <Link 
                  to="/auth" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <Mail className="h-12 w-12 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  We sent a code to <strong className="text-foreground">{email}</strong>
                </p>
              </div>
              <Button onClick={handleContinue} className="w-full btn-gradient">
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue to Reset Password
              </Button>
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Didn't receive the code? Try again
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
