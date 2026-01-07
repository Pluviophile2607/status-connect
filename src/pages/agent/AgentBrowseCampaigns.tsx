import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Briefcase, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  title: string;
  status: string;
  media_url: string | null;
  media_type: string | null;
  price: number;
  created_at: string;
  caption: string | null;
  cta_text: string | null;
  businesses: {
    business_name: string;
    whatsapp_number: string;
    category: string | null;
  } | null;
}

const AgentBrowseCampaigns = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select(`
            id,
            title,
            status,
            media_url,
            media_type,
            price,
            created_at,
            caption,
            cta_text,
            businesses (
              business_name,
              whatsapp_number,
              category
            )
          `)
          .eq('status', 'open')
          .is('agent_id', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCampaigns(data || []);

        // Extract unique categories
        const uniqueCategories = [...new Set(
          data?.map(c => c.businesses?.category).filter(Boolean) as string[]
        )];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const handleClaimCampaign = async (campaignId: string) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          agent_id: profile.id,
          status: 'assigned'
        })
        .eq('id', campaignId)
        .eq('status', 'open');

      if (error) throw error;

      setCampaigns(campaigns.filter(c => c.id !== campaignId));

      toast({
        title: "Campaign claimed!",
        description: "You can now start working on this campaign.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to claim campaign",
        variant: "destructive",
      });
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.businesses?.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = 
      categoryFilter === 'all' || 
      campaign.businesses?.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Browse Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Find campaigns from businesses and start earning
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by campaign or business name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-focus"
            />
          </div>
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Campaign list */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="dashboard-card text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              {searchTerm || categoryFilter !== 'all' ? 'No campaigns found' : 'No campaigns available'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Check back later for new opportunities from businesses'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="dashboard-card hover:shadow-large transition-shadow">
                {/* Media preview */}
                <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center overflow-hidden mb-4">
                  {campaign.media_url ? (
                    campaign.media_type === 'video' ? (
                      <video 
                        src={campaign.media_url} 
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img 
                        src={campaign.media_url} 
                        alt={campaign.title} 
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="text-muted-foreground text-sm">No media preview</div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {campaign.businesses?.business_name}
                      </p>
                    </div>
                    {campaign.businesses?.category && (
                      <Badge variant="secondary" className="text-xs">
                        {campaign.businesses.category}
                      </Badge>
                    )}
                  </div>

                  {campaign.caption && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.caption}
                    </p>
                  )}

                  {campaign.cta_text && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">CTA:</span>{' '}
                      <span className="font-medium">{campaign.cta_text}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <span className="text-xs text-muted-foreground">You'll earn</span>
                      <p className="text-xl font-bold text-primary">
                        ₹{Number(campaign.price).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      className="btn-gradient"
                      onClick={() => handleClaimCampaign(campaign.id)}
                    >
                      Claim Campaign
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AgentBrowseCampaigns;
