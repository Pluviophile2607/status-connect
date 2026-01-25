import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CheckCircle, Clock, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type PaymentMode = 'upi' | 'bank_transfer' | 'cash';

interface Payment {
  _id: string; // MongoDB uses _id
  amount: number;
  payment_status: string;
  payment_mode: PaymentMode | null;
  marked_at: string | null;
  createdAt: string;
  campaign_id: {
    title: string;
    status: string;
  } | null;
  agent_id: { // Added Agent Name
    name: string;
    email: string;
  } | null;
}

const BusinessPayments = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [markingPayment, setMarkingPayment] = useState<Payment | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      // if (!profile?.id) return; // Backend handles auth

      try {
        const data = await api.get('/payments/my-payments');
        setPayments(data || []);

        const paid = (data || []).filter((p: any) => p.payment_status === 'paid')
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
        const pending = (data || []).filter((p: any) => p.payment_status === 'unpaid' || p.payment_status === 'pending')
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

        setTotalPaid(paid);
        setPendingAmount(pending);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [profile?.id]);

  const handleMarkAsPaid = async () => {
    if (!markingPayment || !selectedPaymentMode) return;

    setIsSubmitting(true);

    try {
      await api.put(`/payments/${markingPayment._id}`, {
        payment_status: 'paid',
        payment_mode: selectedPaymentMode
      });



      // Update local state
      setPayments(payments.map(p => 
        p._id === markingPayment._id 
          ? { 
              ...p, 
              payment_status: 'paid' as const, 
              payment_mode: selectedPaymentMode as 'upi' | 'bank_transfer' | 'cash',
              marked_at: new Date().toISOString()
            } 
          : p
      ));

      setPendingAmount(prev => prev - Number(markingPayment.amount));
      setTotalPaid(prev => prev + Number(markingPayment.amount));

      toast({
        title: "Payment marked as paid!",
        description: "The payment status has been updated.",
      });

      setMarkingPayment(null);
      setSelectedPaymentMode('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Manage campaign payments and track spending
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <StatCard
            title="Total Paid"
            value={`₹${totalPaid.toLocaleString()}`}
            icon={CheckCircle}
          />
          <StatCard
            title="Pending Payments"
            value={`₹${pendingAmount.toLocaleString()}`}
            icon={Clock}
          />
          <StatCard
            title="Total Campaigns"
            value={payments.length}
            icon={DollarSign}
          />
        </div>

        {/* Payments Table */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Payment History</h2>

          {payments.length === 0 ? (
            <div className="dashboard-card text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No payments yet</h3>
              <p className="text-muted-foreground">
                Campaign payments will appear here
              </p>
            </div>
          ) : (
            <div className="dashboard-card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="table-header px-4 py-3">Agent</th>
                      <th className="table-header px-4 py-3">Campaign</th>
                      <th className="table-header px-4 py-3">Amount</th>
                      <th className="table-header px-4 py-3">Status</th>
                      <th className="table-header px-4 py-3">Payment Mode</th>
                      <th className="table-header px-4 py-3">Date</th>
                      <th className="table-header px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-muted/30 transition-colors">
                        <td className="table-cell">
                          <div className="font-medium text-foreground">{payment.agent_id?.name || 'Unknown Agent'}</div>
                          <div className="text-xs text-muted-foreground">{payment.agent_id?.email}</div>
                        </td>
                        <td className="table-cell font-medium">
                          {payment.campaign_id?.title || 'Unknown Campaign'}
                        </td>
                        <td className="table-cell font-semibold">
                          ₹{Number(payment.amount).toLocaleString()}
                        </td>
                        <td className="table-cell">
                          <Badge className={cn(
                            'status-badge',
                            payment.payment_status === 'paid' ? 'payment-paid' : 'payment-unpaid'
                          )}>
                            {payment.payment_status}
                          </Badge>
                        </td>
                        <td className="table-cell text-muted-foreground capitalize">
                          {payment.payment_mode?.replace('_', ' ') || '-'}
                        </td>
                        <td className="table-cell text-muted-foreground">
                          {payment.marked_at 
                            ? new Date(payment.marked_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="table-cell">
                          {payment.payment_status === 'unpaid' || payment.payment_status === 'pending' ? (
                            <Button
                              size="sm"
                              onClick={() => setMarkingPayment(payment)}
                              className="btn-gradient px-4"
                            >
                              Pay Now
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mark as Paid Dialog */}
      <Dialog open={!!markingPayment} onOpenChange={() => setMarkingPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Mark this payment as completed. Select the payment method used.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex justify-between mb-2">
                 <span className="text-sm text-muted-foreground">Agent</span>
                 <span className="font-medium">{markingPayment?.agent_id?.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                 <span className="text-sm text-muted-foreground">Campaign</span>
                 <span className="font-medium">{markingPayment?.campaign_id?.title}</span>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                <span className="text-sm font-medium">Amount to Pay</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{Number(markingPayment?.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={selectedPaymentMode} onValueChange={(value) => setSelectedPaymentMode(value as PaymentMode)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkingPayment(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsPaid} 
              disabled={!selectedPaymentMode || isSubmitting}
              className="btn-gradient"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BusinessPayments;
