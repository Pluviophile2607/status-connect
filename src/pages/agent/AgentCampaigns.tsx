import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, FileText, Loader2, Send, Eye } from 'lucide-react';
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
  campaign_analytics: {
    views: number;
  } | null;
}

const AgentCampaigns = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!profile?.id) return;

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
              whatsapp_number
            ),
            campaign_analytics (
              views
            )
          `)
          .eq('agent_id', profile.id)
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

  const handleSubmitForReview = async () => {
    if (!selectedCampaign) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'pending_review' })
        .eq('id', selectedCampaign.id);

      if (error) throw error;

      setCampaigns(campaigns.map(c => 
        c.id === selectedCampaign.id ? { ...c, status: 'pending_review' } : c
      ));

      toast({
        title: "Submitted for review!",
        description: "The business owner will review your work.",
      });

      setSelectedCampaign(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit for review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned: 'bg-blue-100 text-blue-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      live: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      assigned: 'Assigned to You',
      pending_review: 'Pending Review',
      approved: 'Approved',
      rejected: 'Changes Requested',
      live: 'Live',
      completed: 'Completed',
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage campaigns you've claimed and track their progress
          </p>
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
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Changes Requested</SelectItem>
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
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Browse available campaigns to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
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
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {campaign.businesses?.business_name}
                        </p>
                      </div>
                      <Badge className={cn('status-badge', getStatusColor(campaign.status))}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">
                        ₹{Number(campaign.price).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {campaign.campaign_analytics?.views || 0} views
                      </div>
                    </div>

                    {campaign.status === 'rejected' && (
                      <p className="text-sm text-destructive mt-2">
                        The business owner has requested changes. Please update and resubmit.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      {(campaign.status === 'assigned' || campaign.status === 'rejected') && (
                        <Button 
                          size="sm" 
                          className="btn-gradient"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit for Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Campaign for Review</DialogTitle>
            <DialogDescription>
              Confirm that you've completed the campaign and it's ready for the business owner to review.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <p className="font-medium">{selectedCampaign?.title}</p>
              <p className="text-sm text-muted-foreground">
                {selectedCampaign?.businesses?.business_name}
              </p>
              <p className="text-lg font-bold text-primary">
                ₹{Number(selectedCampaign?.price || 0).toLocaleString()}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Once submitted, the business owner will review your work. If approved, you'll receive your payment.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitForReview} 
              disabled={submitting}
              className="btn-gradient"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AgentCampaigns;
