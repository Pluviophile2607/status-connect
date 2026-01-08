import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Eye, 
  FileText, 
  Briefcase,
  TrendingUp,
  Loader2,
  ArrowRight
} from 'lucide-react';
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
  } | null;
}

interface DashboardStats {
  totalEarnings: number;
  totalViews: number;
  activeCampaigns: number;
  availableCampaigns: number;
}

const AgentDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    totalViews: 0,
    activeCampaigns: 0,
    availableCampaigns: 0,
  });
  
  // View commitment modal state
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [viewsToCommit, setViewsToCommit] = useState(0);
  const [isCommitting, setIsCommitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;

      try {
        // Fetch available campaigns (open, with pending views)
        const { data: openCampaigns, error: openError } = await supabase
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
              whatsapp_number
            )
          `)
          .eq('status', 'open')
          .gt('pending_views', 0)
          .order('created_at', { ascending: false })
          .limit(5);

        if (openError) throw openError;
        setAvailableCampaigns((openCampaigns || []) as Campaign[]);

        // Fetch my claimed campaigns (via agent_campaign_claims)
        const { data: myClaims, error: claimsError } = await supabase
          .from('agent_campaign_claims')
          .select(`
            id,
            views_committed,
            views_delivered,
            status,
            campaigns (
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
                whatsapp_number
              )
            )
          `)
          .eq('agent_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (claimsError) throw claimsError;
        
        // Transform claims data to campaigns format with committed views info
        const claimedCampaigns = myClaims?.map(claim => ({
          ...claim.campaigns,
          views_committed: claim.views_committed,
          views_delivered: claim.views_delivered,
          claim_status: claim.status
        })) || [];
        setMyCampaigns(claimedCampaigns as any);

        // Fetch earnings
        const { data: earningsData } = await supabase
          .from('agent_earnings')
          .select('commission_amount')
          .eq('agent_id', profile.id);

        const totalEarnings = earningsData?.reduce(
          (sum, e) => sum + Number(e.commission_amount),
          0
        ) || 0;

        // Fetch campaign IDs for analytics
        const { data: allMyCampaigns } = await supabase
          .from('campaigns')
          .select('id, status')
          .eq('agent_id', profile.id);

        const campaignIds = allMyCampaigns?.map(c => c.id) || [];

        // Fetch views
        let totalViews = 0;
        if (campaignIds.length > 0) {
          const { data: analyticsData } = await supabase
            .from('campaign_analytics')
            .select('views')
            .in('campaign_id', campaignIds);

          totalViews = analyticsData?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;
        }

        // Count all open campaigns
        const { count: openCount } = await supabase
          .from('campaigns')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open')
          .is('agent_id', null);

        const activeCampaigns = allMyCampaigns?.filter(
          c => ['assigned', 'pending_review', 'approved', 'live'].includes(c.status)
        ).length || 0;

        setStats({
          totalEarnings,
          totalViews,
          activeCampaigns,
          availableCampaigns: openCount || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.id]);

  // Open commit modal
  const openCommitModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setViewsToCommit(Math.min(campaign.pending_views, Math.ceil(campaign.pending_views / 2))); // Default to half
    setCommitModalOpen(true);
  };

  // Handle view commitment via RPC
  const handleCommitViews = async () => {
    if (!profile?.id || !selectedCampaign) return;

    setIsCommitting(true);
    try {
      const { data, error } = await supabase.rpc('claim_campaign_views', {
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
      const updatedCampaign = {
        ...selectedCampaign,
        pending_views: result.remaining_views
      };

      if (result.remaining_views === 0) {
        // Remove from available if fully claimed
        setAvailableCampaigns(availableCampaigns.filter(c => c.id !== selectedCampaign.id));
      } else {
        // Update pending views
        setAvailableCampaigns(availableCampaigns.map(c => 
          c.id === selectedCampaign.id ? updatedCampaign : c
        ));
      }

      // Add to my campaigns
      setMyCampaigns([{ 
        ...selectedCampaign, 
        views_committed: viewsToCommit,
        views_delivered: 0,
        claim_status: 'active'
      } as any, ...myCampaigns]);

      setStats(prev => ({
        ...prev,
        activeCampaigns: prev.activeCampaigns + 1,
        availableCampaigns: result.remaining_views === 0 ? prev.availableCampaigns - 1 : prev.availableCampaigns,
      }));

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Welcome back, {profile?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Find campaigns to work on and track your earnings.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Total Earnings"
            value={`₹${stats.totalEarnings.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Total Views"
            value={stats.totalViews.toLocaleString()}
            icon={Eye}
          />
          <StatCard
            title="Active Campaigns"
            value={stats.activeCampaigns}
            icon={TrendingUp}
          />
          <StatCard
            title="Available to Claim"
            value={stats.availableCampaigns}
            icon={Briefcase}
          />
        </div>

        {/* Available Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Available Campaigns</h2>
            <Link to="/agent/browse">
              <Button variant="ghost" size="sm">
                Browse all
              </Button>
            </Link>
          </div>

          {availableCampaigns.length === 0 ? (
            <div className="dashboard-card text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No campaigns available</h3>
              <p className="text-muted-foreground">
                Check back later for new opportunities from businesses
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availableCampaigns.map((campaign) => (
                <div key={campaign.id} className="dashboard-card">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Media preview */}
                    <div className="w-full sm:w-32 h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {campaign.media_url ? (
                        <img 
                          src={campaign.media_url} 
                          alt={campaign.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground text-sm">No media</div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {campaign.businesses?.business_name}
                          </p>
                        </div>
                        <Badge className="status-badge bg-green-100 text-green-800">
                          Open
                        </Badge>
                      </div>

                      {campaign.caption && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {campaign.caption}
                        </p>
                      )}

                      {/* Views info */}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          <Eye className="h-4 w-4 inline mr-1" />
                          {campaign.pending_views} / {campaign.target_views} views available
                        </span>
                        <span className="text-primary font-medium">
                          ₹{(Number(campaign.price) / campaign.target_views).toFixed(2)}/view
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <span className="text-lg font-bold text-primary">
                          ₹{Number(campaign.price).toLocaleString()} total
                        </span>
                        <Button 
                          size="sm" 
                          className="btn-gradient"
                          onClick={() => openCommitModal(campaign)}
                        >
                          Commit Views
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">My Campaigns</h2>
            <Link to="/agent/campaigns">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>

          {myCampaigns.length === 0 ? (
            <div className="dashboard-card text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No active campaigns</h3>
              <p className="text-muted-foreground">
                Commit to some views above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myCampaigns.map((campaign: any) => (
                <div key={campaign.id} className="dashboard-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {campaign.businesses?.business_name}
                      </p>
                      {campaign.views_committed && (
                        <p className="text-sm text-primary mt-1">
                          <Eye className="h-3 w-3 inline mr-1" />
                          {campaign.views_delivered || 0} / {campaign.views_committed} views delivered
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn(
                        'status-badge',
                        campaign.claim_status === 'active' && 'bg-blue-100 text-blue-800',
                        campaign.claim_status === 'completed' && 'bg-green-100 text-green-800',
                        campaign.status === 'pending_review' && 'bg-yellow-100 text-yellow-800',
                      )}>
                        {campaign.claim_status || campaign.status?.replace('_', ' ')}
                      </Badge>
                      <span className="font-semibold text-primary">
                        ₹{campaign.views_committed ? ((campaign.views_committed / campaign.target_views) * Number(campaign.price)).toFixed(0) : Number(campaign.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
              {/* Campaign info */}
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

              {/* Slider */}
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

              {/* Earnings preview */}
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

export default AgentDashboard;
