import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CampaignCard from '@/components/dashboard/CampaignCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, FileText, Loader2, Plus } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  status: string;
  media_url: string | null;
  media_type: string | null;
  price: number;
  created_at: string;
  agent_id: string | null;
  campaign_analytics: {
    views: number;
  } | null;
}

const BusinessCampaigns = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!profile?.id) return;

      try {
        // Get business ID first
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', profile.id)
          .single();

        if (businessError) throw businessError;

        // Fetch campaigns
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
            agent_id,
            campaign_analytics (
              views
            )
          `)
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCampaigns(data || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [profile?.id]);

  const handleApprove = async (campaignId: string) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'approved' })
        .eq('id', campaignId);

      if (error) throw error;

      // Create payment record when approving
      if (campaign) {
        const { data: businessData } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', profile?.id)
          .single();

        if (businessData) {
          await supabase.from('payments').insert({
            campaign_id: campaignId,
            business_id: businessData.id,
            amount: campaign.price,
            payment_status: 'unpaid',
          });
        }
      }

      setCampaigns(campaigns.map(c => 
        c.id === campaignId ? { ...c, status: 'approved' } : c
      ));

      toast({
        title: "Campaign approved!",
        description: "The agent's work has been approved. Please proceed with payment.",
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
        .update({ status: 'rejected' })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(campaigns.map(c => 
        c.id === campaignId ? { ...c, status: 'rejected' } : c
      ));

      toast({
        title: "Campaign rejected",
        description: "The agent has been notified to make changes.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject campaign",
        variant: "destructive",
      });
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft',
      open: 'Open for Agents',
      assigned: 'Agent Assigned',
      pending_review: 'Pending Your Review',
      approved: 'Approved',
      rejected: 'Rejected',
      live: 'Live',
      completed: 'Completed',
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Manage your marketing campaigns and review agent submissions
            </p>
          </div>
          <Link to="/business/campaigns/new">
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-focus"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Open for Agents</SelectItem>
              <SelectItem value="assigned">Agent Assigned</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campaign list */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="dashboard-card text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No campaigns found' : 'No campaigns yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first campaign to attract marketing agents'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to="/business/campaigns/new">
                <Button className="btn-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                title={campaign.title}
                status={campaign.status}
                mediaUrl={campaign.media_url || undefined}
                mediaType={campaign.media_type || undefined}
                price={Number(campaign.price)}
                views={campaign.campaign_analytics?.views || 0}
                createdAt={campaign.created_at}
                showActions={campaign.status === 'pending_review'}
                isBusinessView
                onApprove={() => handleApprove(campaign.id)}
                onReject={() => handleReject(campaign.id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BusinessCampaigns;
