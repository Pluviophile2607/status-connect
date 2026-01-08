import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Briefcase, Loader2, ArrowRight, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  title: string;
  status: string;
  media_url: string | null;
  media_type: string | null;
  price: number;
  target_views: number;
  pending_views: number;
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
  
  // View commitment modal state
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [viewsToCommit, setViewsToCommit] = useState(0);
  const [isCommitting, setIsCommitting] = useState(false);

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
            target_views,
            pending_views,
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
          .gt('pending_views', 0)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCampaigns((data || []) as Campaign[]);

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

  // Open commit modal
  const openCommitModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setViewsToCommit(Math.min(campaign.pending_views, Math.ceil(campaign.pending_views / 2)));
    setCommitModalOpen(true);
  };

  // Handle view commitment via RPC
  const handleCommitViews = async () => {
    if (!profile?.id || !selectedCampaign) return;

    setIsCommitting(true);
    try {
      const { data, error } = await supabase.rpc('claim_campaign_views' as any, {
        p_campaign_id: selectedCampaign.id,
        p_agent_id: profile.id,
        p_views_to_commit: viewsToCommit
      });

      if (error) throw error;

      const result = data as any;
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update UI
      if (result.remaining_views === 0) {
        setCampaigns(campaigns.filter(c => c.id !== selectedCampaign.id));
      } else {
        setCampaigns(campaigns.map(c => 
          c.id === selectedCampaign.id 
            ? { ...c, pending_views: result.remaining_views }
            : c
        ));
      }

      toast({
        title: "Views Committed!",
        description: `You committed to ${viewsToCommit} views. You'll earn ₹${result.earnings.toFixed(2)}.`,
      });

      setCommitModalOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to commit views",
        variant: "destructive",
      });
    } finally {
      setIsCommitting(false);
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

                  {/* Views info */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      <Eye className="h-4 w-4 inline mr-1" />
                      {campaign.pending_views} / {campaign.target_views} views available
                    </span>
                    <span className="text-primary font-medium">
                      ₹{(Number(campaign.price) / campaign.target_views).toFixed(2)}/view
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <span className="text-xs text-muted-foreground">Total budget</span>
                      <p className="text-xl font-bold text-primary">
                        ₹{Number(campaign.price).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      className="btn-gradient"
                      onClick={() => openCommitModal(campaign)}
                    >
                      Commit Views
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Commitment Modal */}
      <Dialog open={commitModalOpen} onOpenChange={setCommitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Commit to Views</DialogTitle>
            <DialogDescription>
              Choose how many views you want to commit to for "{selectedCampaign?.title}"
            </DialogDescription>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6 py-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available views:</span>
                  <span className="font-medium">{selectedCampaign.pending_views} of {selectedCampaign.target_views}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Rate per view:</span>
                  <span className="font-medium">₹{(Number(selectedCampaign.price) / selectedCampaign.target_views).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Views to commit</Label>
                  <span className="text-lg font-bold text-primary">{viewsToCommit}</span>
                </div>
                <Slider
                  value={[viewsToCommit]}
                  onValueChange={(value) => setViewsToCommit(value[0])}
                  min={1}
                  max={selectedCampaign.pending_views}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 view</span>
                  <span>{selectedCampaign.pending_views} views (max)</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground mb-1">You'll earn</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{((viewsToCommit / selectedCampaign.target_views) * Number(selectedCampaign.price)).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  for {viewsToCommit} views
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCommitModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="btn-gradient" 
              onClick={handleCommitViews}
              disabled={isCommitting || viewsToCommit < 1}
            >
              {isCommitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Commit {viewsToCommit} Views
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AgentBrowseCampaigns;
