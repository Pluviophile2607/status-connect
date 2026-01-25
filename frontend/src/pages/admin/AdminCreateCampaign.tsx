import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api'; // Changed from Supabase
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Image, Video } from 'lucide-react';

const AdminCreateCampaign = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    ctaText: '',
    targetViews: '',
    budget: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video',
  });

  useEffect(() => {
    const ensureBusinessProfile = async () => {
      if (!profile?.id) return;

      try {
        // Check if Admin has a business profile
        try {
           const existingBusiness = await api.get('/business/mine');
           setBusinessId(existingBusiness._id);
        } catch (error) {
           // If 404, CREATE one for the Admin
           console.log('Creating business profile for Admin...');
           const newBusiness = await api.post('/business', {
              company_name: 'Admin Business',
              whatsapp_number: profile.email || 'N/A', // Adjust payload as per controller
           });
           setBusinessId(newBusiness._id);
           toast({
             title: "Setup Complete",
             description: "Admin business profile created successfully.",
           });
        }
      } catch (error) {
        console.error('Error ensuring business profile:', error);
        toast({
          title: "Setup Error",
          description: "Could not setup admin business profile. You might not be able to create campaigns.",
          variant: "destructive",
        });
      }
    };

    ensureBusinessProfile();
  }, [profile?.id, profile?.email, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessId) {
      toast({
        title: "Error",
        description: "Business profile not ready. Please try refreshing.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const targetViews = parseInt(formData.targetViews) || 0;
      const budget = parseFloat(formData.budget) || 0;

      if (targetViews <= 0) {
        toast({
          title: "Error",
          description: "Target views must be greater than 0",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      await api.post('/campaigns', {
          title: formData.title,
          caption: formData.caption,
          cta_text: formData.ctaText, // Check if controller supports this field? My controller didn't explicit destructure it, but Schema allows extraneous? No, Mongoose Strict mode removes it if not in schema.
          // Wait, 'cta_text' and 'caption' were NOT in my Campaign model!
          // I need to update Campaign model again.
          // For now I will include them here but I must update model.
          price: budget,
          target_views: targetViews,
          media_url: formData.mediaUrl || null,
          media_type: formData.mediaType,
          // business_id is handled by controller using user->business lookup usually, but here I passed it.
          // My controller: const business = await Business.findOne({ owner_id: req.user.id });
          // So I don't need to pass business_id in body if I am the owner.
      });

      toast({
        title: "Campaign created!",
        description: "Your campaign is now live.",
      });

      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="border-border shadow-medium">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Campaign</CardTitle>
            <CardDescription>
              Create a marketing campaign as Admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Sale Promotion"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="input-focus"
                />
              </div>

              <div className="space-y-2">
                <Label>Media Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={formData.mediaType === 'image' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, mediaType: 'image' })}
                    className={formData.mediaType === 'image' ? 'btn-gradient' : ''}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                  <Button
                    type="button"
                    variant={formData.mediaType === 'video' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, mediaType: 'video' })}
                    className={formData.mediaType === 'video' ? 'btn-gradient' : ''}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mediaUrl">Media URL</Label>
                <Input
                  id="mediaUrl"
                  placeholder="https://i.imgur.com/example.jpg"
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  className="input-focus"
                />
                <p className="text-xs text-muted-foreground">
                  Use a direct image link.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption / Message</Label>
                <Textarea
                  id="caption"
                  placeholder="Message for agents..."
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  rows={4}
                  className="input-focus resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaText">Call to Action Text</Label>
                <Input
                  id="ctaText"
                  placeholder="e.g., Shop Now"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  className="input-focus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetViews">Target Views *</Label>
                <Input
                  id="targetViews"
                  type="number"
                  placeholder="How many views?"
                  min="1"
                  value={formData.targetViews}
                  onChange={(e) => {
                    const views = parseInt(e.target.value) || 0;
                    const calculatedBudget = (views * 0.25).toFixed(2);
                    setFormData({ 
                      ...formData, 
                      targetViews: e.target.value,
                      budget: calculatedBudget
                    });
                  }}
                  required
                  className="input-focus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget (₹)</Label>
                <div className="relative">
                  <Input
                    id="budget"
                    type="text"
                    value={formData.budget ? `₹${formData.budget}` : ''}
                    readOnly
                    className="input-focus bg-muted/50"
                  />
                </div>
                <p className="text-xs text-primary font-medium">
                  Rate: ₹0.25 per view
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !businessId}
                  className="flex-1 btn-gradient"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Campaign'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminCreateCampaign;
