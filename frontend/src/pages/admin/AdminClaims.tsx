import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, FileText, User, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

interface Claim {
  _id: string;
  status: string;
  views_committed: number;

  created_at: string;
  proof_url?: string;
  agent_id: {
    _id: string;
    name: string;
    email: string;
  };
  campaign_id: {
    title: string;
    target_views: number;
    price: number;
    business_id: {
        company_name: string;
    } | null;
  } | null;
}

const AdminClaims = () => {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<Claim[]>([]);
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  const fetchClaims = async () => {
    try {
      const data = await api.get('/claims/admin/all');
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast({
        title: "Error",
        description: "Failed to fetch claims",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      await api.put(`/claims/${id}/status`, { status });
      
      toast({
        title: status === 'approved' ? "Claim Approved" : "Claim Rejected",
        description: `Successfully ${status} the claim.`,
      });

      // Optimistic update or refetch
      setClaims(claims.map(c => 
        c._id === id ? { ...c, status } : c
      ));

    } catch (error: any) {
      console.error('Error updating claim:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update claim",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-blue-100 text-blue-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
    <>
    <DashboardLayout>
       <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Claims Review</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve work submitted by agents
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Business</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Payout</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {claims.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No claims found
                            </TableCell>
                        </TableRow>
                    ) : (
                        claims.map((claim) => (
                            <TableRow key={claim._id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">{claim.agent_id?.name || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground">{claim.agent_id?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{claim.campaign_id?.title || 'Deleted Campaign'}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{claim.campaign_id?.business_id?.company_name || '-'}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {claim.views_committed} views
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="font-semibold text-green-600">
                                         ₹{claim.campaign_id ? ((claim.views_committed / claim.campaign_id.target_views) * claim.campaign_id.price).toFixed(2) : '-'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn('status-badge', getStatusColor(claim.status))}>
                                        {claim.status === 'pending_approval' || claim.status === 'submitted' ? 'Pending Review' : claim.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {(claim.status === 'pending_approval' || claim.status === 'submitted') && (
                                        <div className="flex justify-end gap-2">
                                            {claim.proof_url && (
                                              <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                  onClick={() => setViewingProof(claim.proof_url || null)}
                                              >
                                                  <Eye className="h-4 w-4" />
                                                  <span className="sr-only">View Proof</span>
                                              </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => handleUpdateStatus(claim._id, 'approved')}
                                                disabled={processingId === claim._id}
                                            >
                                                {processingId === claim._id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                                                <span className="sr-only">Approve</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleUpdateStatus(claim._id, 'rejected')}
                                                disabled={processingId === claim._id}
                                            >
                                                {processingId === claim._id ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4" />}
                                                <span className="sr-only">Reject</span>
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
             </Table>
        </div>
       </div>
    </DashboardLayout>

     <Dialog open={!!viewingProof} onOpenChange={() => setViewingProof(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Proof of Work</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-muted/20 rounded-lg">
            {viewingProof && (
              <img 
                src={viewingProof} 
                alt="Proof of work" 
                className="max-h-[80vh] w-auto object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminClaims;
