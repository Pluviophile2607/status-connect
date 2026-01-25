import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import CampaignCard from '@/components/dashboard/CampaignCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api'; // Changed from Supabase
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  DollarSign,
  Plus,
  Loader2,
  Users,
  Eye
} from 'lucide-react';

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
  agent_id: string | null;
}

interface AgentClaim {
  id: string;
  campaign_id: string;
  views_committed: number;
  views_delivered: number;
  status: string;
  agent: {
    name: string;
    email: string;
  } | null;
  campaign: {
    title: string;
    target_views: number;
    price: number;
  } | null;
}

interface DashboardStats {
  totalCampaigns: number;
  openCampaigns: number;
  pendingReview: number;
  totalSpent: number;
}

const BusinessDashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [agentClaims, setAgentClaims] = useState<AgentClaim[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    openCampaigns: 0,
    pendingReview: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;

      try {
        // 1. Get Business
        const businessData = await api.get('/business/mine');
        setBusinessId(businessData._id);

        // 2. Get Campaigns
        const campaignsData = await api.get('/campaigns/my-campaigns');
        const campaignsList = (campaignsData || []).map((c: any) => ({
          ...c,
          id: c._id,
        })) as Campaign[];
        setCampaigns(campaignsList.slice(0, 5)); // Limit to 5 for "Recent Campaigns"

        // 3. Get Agent Claims (with populated agent and campaign)
        const claimsData = await api.get('/claims/business');
        const enrichedClaims = (claimsData || []).map((claim: any) => ({
            id: claim._id,
            campaign_id: claim.campaign_id?._id, // Flatten if needed, but keeping for reference
            views_committed: claim.views_committed,
            views_delivered: claim.views_delivered,
            status: claim.status,
            agent: claim.agent_id, // Populated from backend
            campaign: claim.campaign_id, // Populated from backend
        })) as AgentClaim[];
        setAgentClaims(enrichedClaims.slice(0, 10)); // Limit to 10

        // 4. Get Payments for Stats
        const paymentsData = await api.get('/payments/my-payments');
        const paidPayments = paymentsData.filter((p: any) => p.payment_status === 'paid');
        const totalSpent = paidPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        // 5. Calculate Stats
        // Use full campaigns list for stats if needed, or if API endpoint was limited, we might need a separate stats endpoint.
        // For now, assuming distinct endpoints or client-side calculation on full list. 
        // Actually, getMyCampaigns returned ALL campaigns.
        setStats({
          totalCampaigns: campaignsList.length,
          openCampaigns: campaignsList.filter(c => c.status === 'open').length,
          pendingReview: campaignsList.filter(c => c.status === 'pending_review').length,
          totalSpent,
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
              Create campaigns and track agent performance
            </p>
          </div>
          <Link to="/business/campaigns/new">
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Total Campaigns"
            value={stats.totalCampaigns}
            icon={FileText}
          />
          <StatCard
            title="Open for Agents"
            value={stats.openCampaigns}
            icon={Clock}
          />
          <StatCard
            title="Pending Review"
            value={stats.pendingReview}
            icon={CheckCircle}
          />
          <StatCard
            title="Total Spent"
            value={`₹${stats.totalSpent.toLocaleString()}`}
            icon={DollarSign}
          />
        </div>

        {/* Agent Commitments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Agent Commitments</h2>
          </div>

          {agentClaims.length === 0 ? (
            <div className="dashboard-card text-center py-8">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No agent commitments yet</h3>
              <p className="text-sm text-muted-foreground">
                Agents will appear here when they commit to your campaigns
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agentClaims.map((claim) => (
                <div key={claim.id} className="dashboard-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {claim.agent?.name || 'Unknown Agent'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {claim.campaign?.title || 'Campaign'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {claim.views_delivered} / {claim.views_committed}
                          </span>
                          <span className="text-muted-foreground">views</span>
                        </div>
                        <p className="text-sm text-primary font-medium">
                          ₹{claim.campaign ? ((claim.views_committed / claim.campaign.target_views) * claim.campaign.price).toFixed(0) : 0}
                        </p>
                      </div>
                      <Badge className={
                        claim.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        claim.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {claim.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Campaigns</h2>
            <Link to="/business/campaigns">
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
                Create your first campaign to attract marketing agents
              </p>
              <Link to="/business/campaigns/new">
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
                  showActions={campaign.status === 'pending_review'}
                  isBusinessView
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BusinessDashboard;
