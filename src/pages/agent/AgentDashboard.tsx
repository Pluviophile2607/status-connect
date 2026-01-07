import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import CampaignCard from '@/components/dashboard/CampaignCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  Eye, 
  FileText, 
  Plus,
  TrendingUp,
  Loader2
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  status: string;
  media_url: string | null;
  media_type: string | null;
  price: number;
  created_at: string;
  businesses: {
    business_name: string;
  } | null;
}

interface DashboardStats {
  totalEarnings: number;
  totalViews: number;
  activeCampaigns: number;
  pendingCampaigns: number;
}

const AgentDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    totalViews: 0,
    activeCampaigns: 0,
    pendingCampaigns: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;

      try {
        // Fetch campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select(`
            id,
            title,
            status,
            media_url,
            media_type,
            price,
            created_at,
            businesses (
              business_name
            )
          `)
          .eq('agent_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (campaignsError) throw campaignsError;
        setCampaigns(campaignsData || []);

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
        const { data: allCampaigns } = await supabase
          .from('campaigns')
          .select('id, status')
          .eq('agent_id', profile.id);

        const campaignIds = allCampaigns?.map(c => c.id) || [];

        // Fetch views
        let totalViews = 0;
        if (campaignIds.length > 0) {
          const { data: analyticsData } = await supabase
            .from('campaign_analytics')
            .select('views')
            .in('campaign_id', campaignIds);

          totalViews = analyticsData?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;
        }

        const activeCampaigns = allCampaigns?.filter(
          c => ['approved', 'live', 'sent'].includes(c.status)
        ).length || 0;

        const pendingCampaigns = allCampaigns?.filter(
          c => c.status === 'pending'
        ).length || 0;

        setStats({
          totalEarnings,
          totalViews,
          activeCampaigns,
          pendingCampaigns,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.id]);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Welcome back, {profile?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your campaigns today.
            </p>
          </div>
          <Link to="/agent/campaigns/new">
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
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
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Active Campaigns"
            value={stats.activeCampaigns}
            icon={TrendingUp}
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingCampaigns}
            icon={FileText}
          />
        </div>

        {/* Recent Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Campaigns</h2>
            <Link to="/agent/campaigns">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="dashboard-card text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first campaign to get started
              </p>
              <Link to="/agent/campaigns/new">
                <Button className="btn-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  id={campaign.id}
                  title={campaign.title}
                  status={campaign.status}
                  mediaUrl={campaign.media_url || undefined}
                  mediaType={campaign.media_type || undefined}
                  price={Number(campaign.price)}
                  createdAt={campaign.created_at}
                  businessName={campaign.businesses?.business_name}
                  showActions
                  onView={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;
