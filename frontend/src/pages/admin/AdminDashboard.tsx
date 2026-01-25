import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import CampaignCard from '@/components/dashboard/CampaignCard';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api'; // Changed from Supabase
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Plus,
  Loader2,
  Trash2
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  status: string;
  media_url: string | null;
  media_type: string | null;
  price: number;
  target_views: number;
  created_at: string;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    openCampaigns: 0,
    completedCampaigns: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL campaigns from Backend API
      const campaignsData = await api.get('/campaigns');

      // Map _id to id
      const campaignsList = (campaignsData || []).map((c: any) => ({
        ...c,
        id: c._id,
      })) as Campaign[];
      
      setCampaigns(campaignsList);

      setStats({
        totalCampaigns: campaignsList.length,
        openCampaigns: campaignsList.filter(c => c.status === 'open').length,
        completedCampaigns: campaignsList.filter(c => c.status === 'completed').length,
      });

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteCampaign = async (id: string) => {
    try {
      await api.delete(`/campaigns/${id}`);

      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });

      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage platform campaigns and users
            </p>
          </div>
          <Link to="/admin/campaigns/new">
            <Button className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <StatCard
            title="Total Campaigns"
            value={stats.totalCampaigns}
            icon={FileText}
          />
          <StatCard
            title="Active Campaigns"
            value={stats.openCampaigns}
            icon={Clock}
          />
          <StatCard
            title="Completed"
            value={stats.completedCampaigns}
            icon={CheckCircle}
          />
        </div>

        {/* Campaigns List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">All Campaigns</h2>
          </div>

          {campaigns.length === 0 ? (
            <div className="dashboard-card text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a campaign to get started
              </p>
              <Link to="/admin/campaigns/new">
                <Button className="btn-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="relative group">
                  <CampaignCard
                    id={campaign.id}
                    title={campaign.title}
                    status={campaign.status}
                    mediaUrl={campaign.media_url || undefined}
                    mediaType={campaign.media_type || undefined}
                    price={Number(campaign.price)}
                    createdAt={campaign.created_at}
                    showActions={false}
                    isBusinessView // Reusing this prop for styling
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        if (window.confirm('Are you sure you want to delete this campaign?')) {
                          handleDeleteCampaign(campaign.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
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

export default AdminDashboard;
