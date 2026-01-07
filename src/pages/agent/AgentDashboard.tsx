import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;

      try {
        // Fetch available campaigns (open, no agent assigned)
        const { data: openCampaigns, error: openError } = await supabase
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
              whatsapp_number
            )
          `)
          .eq('status', 'open')
          .is('agent_id', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (openError) throw openError;
        setAvailableCampaigns(openCampaigns || []);

        // Fetch my claimed campaigns
        const { data: claimedCampaigns, error: claimedError } = await supabase
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
              whatsapp_number
            )
          `)
          .eq('agent_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (claimedError) throw claimedError;
        setMyCampaigns(claimedCampaigns || []);

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

      // Move campaign from available to my campaigns
      const claimed = availableCampaigns.find(c => c.id === campaignId);
      if (claimed) {
        setAvailableCampaigns(availableCampaigns.filter(c => c.id !== campaignId));
        setMyCampaigns([{ ...claimed, status: 'assigned' }, ...myCampaigns]);
        setStats(prev => ({
          ...prev,
          activeCampaigns: prev.activeCampaigns + 1,
          availableCampaigns: prev.availableCampaigns - 1,
        }));
      }

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

                      <div className="flex items-center justify-between mt-4">
                        <span className="text-lg font-bold text-primary">
                          ₹{Number(campaign.price).toLocaleString()}
                        </span>
                        <Button 
                          size="sm" 
                          className="btn-gradient"
                          onClick={() => handleClaimCampaign(campaign.id)}
                        >
                          Claim Campaign
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
                Claim a campaign above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myCampaigns.map((campaign) => (
                <div key={campaign.id} className="dashboard-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {campaign.businesses?.business_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn(
                        'status-badge',
                        campaign.status === 'assigned' && 'bg-blue-100 text-blue-800',
                        campaign.status === 'pending_review' && 'bg-yellow-100 text-yellow-800',
                        campaign.status === 'approved' && 'bg-green-100 text-green-800',
                        campaign.status === 'rejected' && 'bg-red-100 text-red-800',
                        campaign.status === 'live' && 'bg-purple-100 text-purple-800',
                        campaign.status === 'completed' && 'bg-gray-100 text-gray-800',
                      )}>
                        {campaign.status.replace('_', ' ')}
                      </Badge>
                      <span className="font-semibold text-primary">
                        ₹{Number(campaign.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;
