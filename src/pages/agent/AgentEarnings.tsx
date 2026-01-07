import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, Calendar, Loader2 } from 'lucide-react';

interface Earning {
  id: string;
  commission_amount: number;
  created_at: string;
  campaigns: {
    title: string;
    businesses: {
      business_name: string;
    } | null;
  } | null;
}

const AgentEarnings = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('agent_earnings')
          .select(`
            id,
            commission_amount,
            created_at,
            campaigns (
              title,
              businesses (
                business_name
              )
            )
          `)
          .eq('agent_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setEarnings(data || []);

        const total = data?.reduce((sum, e) => sum + Number(e.commission_amount), 0) || 0;
        setTotalEarnings(total);

        // Calculate this month's earnings
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonth = data?.filter(
          (e) => new Date(e.created_at) >= startOfMonth
        ).reduce((sum, e) => sum + Number(e.commission_amount), 0) || 0;
        setThisMonthEarnings(thisMonth);
      } catch (error) {
        console.error('Error fetching earnings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
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
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Earnings</h1>
          <p className="text-muted-foreground mt-1">
            Track your commission and revenue
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <StatCard
            title="Total Earnings"
            value={`₹${totalEarnings.toLocaleString()}`}
            icon={DollarSign}
          />
          <StatCard
            title="This Month"
            value={`₹${thisMonthEarnings.toLocaleString()}`}
            icon={TrendingUp}
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            title="Total Campaigns Paid"
            value={earnings.length}
            icon={Calendar}
          />
        </div>

        {/* Earnings History */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Earnings History</h2>

          {earnings.length === 0 ? (
            <div className="dashboard-card text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No earnings yet</h3>
              <p className="text-muted-foreground">
                Complete campaigns to start earning commissions
              </p>
            </div>
          ) : (
            <div className="dashboard-card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="table-header px-4 py-3">Campaign</th>
                      <th className="table-header px-4 py-3">Business</th>
                      <th className="table-header px-4 py-3">Amount</th>
                      <th className="table-header px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {earnings.map((earning) => (
                      <tr key={earning.id} className="hover:bg-muted/30 transition-colors">
                        <td className="table-cell font-medium">
                          {earning.campaigns?.title || 'Unknown Campaign'}
                        </td>
                        <td className="table-cell text-muted-foreground">
                          {earning.campaigns?.businesses?.business_name || 'N/A'}
                        </td>
                        <td className="table-cell font-semibold text-success">
                          ₹{Number(earning.commission_amount).toLocaleString()}
                        </td>
                        <td className="table-cell text-muted-foreground">
                          {new Date(earning.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
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
    </DashboardLayout>
  );
};

export default AgentEarnings;
