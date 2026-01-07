import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import CampaignCard from '@/components/dashboard/CampaignCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  DollarSign,
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
}

interface DashboardStats {
  totalCampaigns: number;
  pendingApproval: number;
  activeCampaigns: number;
  totalSpent: number;
}

const BusinessDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    pendingApproval: 0,
    activeCampaigns: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;

      try {
        // Get business ID first
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', profile.id)
          .single();

        if (businessError) throw businessError;
        setBusinessId(businessData.id);

        // Fetch campaigns for this business
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (campaignsError) throw campaignsError;
        setCampaigns(campaignsData || []);

        // Fetch all campaigns for stats
        const { data: allCampaigns } = await supabase
          .from('campaigns')
          .select('id, status, price')
          .eq('business_id', businessData.id);

        // Fetch payments
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, payment_status')
          .eq('business_id', businessData.id)
          .eq('payment_status', 'paid');

        const totalSpent = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        setStats({
          totalCampaigns: allCampaigns?.length || 0,
          pendingApproval: allCampaigns?.filter(c => c.status === 'pending').length || 0,
          activeCampaigns: allCampaigns?.filter(c => ['approved', 'live', 'sent'].includes(c.status)).length || 0,
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

  const handleApprove = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'approved' })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(campaigns.map(c => 
        c.id === campaignId ? { ...c, status: 'approved' } : c
      ));

      toast({
        title: "Campaign approved!",
        description: "The campaign has been approved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve campaign",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'draft' })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(campaigns.map(c => 
        c.id === campaignId ? { ...c, status: 'draft' } : c
      ));

      toast({
        title: "Campaign rejected",
        description: "The campaign has been sent back as draft.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject campaign",
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
            Manage your campaigns and track performance
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Total Campaigns"
            value={stats.totalCampaigns}
            icon={FileText}
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingApproval}
            icon={Clock}
          />
          <StatCard
            title="Active Campaigns"
            value={stats.activeCampaigns}
            icon={CheckCircle}
          />
          <StatCard
            title="Total Spent"
            value={`₹${stats.totalSpent.toLocaleString()}`}
            icon={DollarSign}
          />
        </div>

        {/* Recent Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Campaigns</h2>
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
              <p className="text-muted-foreground">
                Campaigns assigned to your business will appear here
              </p>
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
                  showActions
                  isBusinessView
                  onApprove={() => handleApprove(campaign.id)}
                  onReject={() => handleReject(campaign.id)}
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
