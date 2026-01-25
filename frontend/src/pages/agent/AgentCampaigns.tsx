import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Search, FileText, Loader2, Send, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Label } from "@/components/ui/label";

// Update interface to match our populated backend response
interface Claim {
  _id: string; // Claim ID
  status: string; // active, pending_approval, approved, rejected
  views_committed: number;
  views_delivered: number;
  createdAt: string;
  campaign_id: {
    title: string;
    description: string;
    media_url: string;
    media_type: string;
    price: number;
    target_views: number;
    business_id: {
      company_name: string;
    } | null;
  } | null;
}

const AgentCampaigns = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchClaims = async () => {
      if (!profile?.id) return;

      try {
        const data = await api.get('/claims/my-claims');
        // Filter out claims where campaign_id is null (deleted campaigns)
        setClaims((data || []).filter((c: any) => c.campaign_id));
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [profile?.id]);

  const handleSubmitForReview = async () => {
    if (!selectedClaim) return;

    setSubmitting(true);

    try {
      let proofUrl = '';

      if (proofFile) {
        // Convert to Base64
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(proofFile);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
        proofUrl = base64;
      }

      await api.put(`/claims/${selectedClaim._id}/status`, {
        status: 'submitted',
        proof_url: proofUrl,
      });

      setClaims(claims.map(c => 
        c._id === selectedClaim._id ? { ...c, status: 'pending_approval' } : c
      ));

      toast({
        title: "Submitted for review!",
        description: "The admin will review your work.",
      });

      setSelectedClaim(null);
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

  const filteredClaims = claims.filter((claim) => {
    const title = claim.campaign_id?.title || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-blue-100 text-blue-800', // Claimed but not done
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800', // Paid
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'In Progress',
      pending_approval: 'Pending Review',
      approved: 'Approved',
      rejected: 'Changes Requested',
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
              <SelectItem value="active">In Progress</SelectItem>
              <SelectItem value="pending_approval">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Changes Requested</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campaign list */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredClaims.length === 0 ? (
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
            {filteredClaims.map((claim) => (
              <div key={claim._id} className="dashboard-card">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Media preview */}
                  <div className="w-full sm:w-32 h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {claim.campaign_id?.media_url ? (
                      <img 
                        src={claim.campaign_id.media_url} 
                        alt={claim.campaign_id.title} 
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
                        <h3 className="font-semibold text-foreground">{claim.campaign_id?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {claim.campaign_id?.business_id?.company_name || 'Business'}
                        </p>
                      </div>
                      <Badge className={cn('status-badge', getStatusColor(claim.status))}>
                        {getStatusLabel(claim.status)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">
                        Est. Reward: ₹{claim.campaign_id ? ((claim.views_committed / claim.campaign_id.target_views) * claim.campaign_id.price).toFixed(2) : '0.00'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        Committed: {claim.views_committed} views
                      </div>
                    </div>

                    {claim.status === 'rejected' && (
                      <p className="text-sm text-destructive mt-2">
                        The admin has requested changes. Please check feedback and resubmit.
                      </p>
                    )}

                     {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(claim.status === 'active' || claim.status === 'rejected') && (
                        <Button 
                          size="sm" 
                          className="btn-gradient"
                          onClick={() => setSelectedClaim(claim)}
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
      <Dialog open={!!selectedClaim} onOpenChange={(open) => {
        if (!open) {
          setSelectedClaim(null);
          setProofFile(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Campaign for Review</DialogTitle>
            <DialogDescription>
              Confirm that you've completed the campaign (posted status) and received the views.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <p className="font-medium">{selectedClaim?.campaign_id?.title}</p>
              <div className="flex justify-between text-sm">
                  <span>Committed Views:</span>
                  <span className="font-bold">{selectedClaim?.views_committed}</span>
              </div>
               <div className="flex justify-between text-sm">
                  <span>Estimated Payout:</span>
                  <span className="font-bold text-green-600">
                    ₹{selectedClaim?.campaign_id ? ((selectedClaim.views_committed / selectedClaim.campaign_id.target_views) * selectedClaim.campaign_id.price).toFixed(2) : '-'}
                  </span>
              </div>
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5 mt-4">
              <Label htmlFor="proof">Upload Proof (Screenshot)</Label>
              <Input 
                id="proof" 
                type="file" 
                accept="image/png, image/jpeg, image/jpg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                        toast({
                            title: "Image size too large",
                            description: "Please make it under 5MB",
                            variant: "destructive"
                        });
                        e.target.value = ''; // Reset input
                        setProofFile(null);
                        return;
                    }
                    setProofFile(file);
                  }
                }} 
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: .png, .jpg, .jpeg
              </p>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
               By clicking Submit, you confirm that you have posted the content to your WhatsApp Status and achieved the committed views. The admin will verify your proof.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClaim(null)}>
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
