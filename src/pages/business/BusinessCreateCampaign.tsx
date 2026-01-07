import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Image, Video } from 'lucide-react';

const BusinessCreateCampaign = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    ctaText: '',
    price: '',
    mediaUrl: '',
    mediaType: 'image' as 'image' | 'video',
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching business:', error);
        toast({
          title: "Error",
          description: "Could not find your business profile",
          variant: "destructive",
        });
        return;
      }

      setBusinessId(data.id);
    };

    fetchBusiness();
  }, [profile?.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessId) {
      toast({
        title: "Error",
        description: "Business profile not found",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create campaign (no agent_id - it's open for agents to claim)
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          title: formData.title,
          caption: formData.caption,
          cta_text: formData.ctaText,
          price: parseFloat(formData.price) || 0,
          media_url: formData.mediaUrl || null,
          media_type: formData.mediaType,
          business_id: businessId,
          agent_id: null,
          status: 'open', // Available for agents to claim
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create initial analytics record
      await supabase
        .from('campaign_analytics')
        .insert({
          campaign_id: campaign.id,
          views: 0,
          leads: 0,
        });

      toast({
        title: "Campaign created!",
        description: "Your campaign is now open for agents to claim.",
      });

      navigate('/business/campaigns');
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
              Create a marketing campaign for agents to promote on WhatsApp Status
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
                  placeholder="https://example.com/your-promo-image.jpg"
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  className="input-focus"
                />
                <p className="text-xs text-muted-foreground">
                  Provide a direct link to your promotional image or video
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption / Message</Label>
                <Textarea
                  id="caption"
                  placeholder="Write the message agents should post with this campaign..."
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
                  placeholder="e.g., Shop Now, Visit Us, Call Today"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  className="input-focus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Budget / Agent Payment (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Amount you'll pay the agent"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="input-focus"
                />
                <p className="text-xs text-muted-foreground">
                  This is the amount you'll pay the agent for completing this campaign
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
                      Creating...
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

export default BusinessCreateCampaign;
