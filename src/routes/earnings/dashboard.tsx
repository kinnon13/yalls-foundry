/**
 * Earnings Dashboard
 * Production UI: Mac efficiency + TikTok feel + Amazon capabilities
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { Download, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { tokens } from '@/design/tokens';

interface EarningsEvent {
  id: string;
  kind: 'commission' | 'referral' | 'membership' | 'tip' | 'adjustment';
  amount_cents: number;
  occurred_at: string;
  captured: boolean;
  metadata: Record<string, any>;
}

export default function EarningsDashboard() {
  // Fetch earnings events
  const { data: events = [] } = useQuery({
    queryKey: ['earnings_events'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('earnings_events')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as EarningsEvent[];
    },
  });

  // Calculate totals
  const totalEarned = events.reduce((sum, e) => sum + e.amount_cents, 0);
  const totalCaptured = events.filter(e => e.captured).reduce((sum, e) => sum + e.amount_cents, 0);
  const pending = totalEarned - totalCaptured;
  const missed = events.filter(e => !e.captured).reduce((sum, e) => sum + e.amount_cents, 0);

  const exportCSV = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'Status', 'Metadata'],
      ...events.map(e => [
        new Date(e.occurred_at).toLocaleDateString(),
        e.kind,
        `$${(e.amount_cents / 100).toFixed(2)}`,
        e.captured ? 'Captured' : 'Pending',
        JSON.stringify(e.metadata),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div style={{ padding: tokens.space.xl, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.l }}>
        <h1 style={{ fontSize: tokens.typography.size.xxl, fontWeight: tokens.typography.weight.bold }}>
          Earnings
        </h1>
        <Button variant="ghost" size="m" onClick={exportCSV}>
          <Download size={16} style={{ marginRight: tokens.space.xs }} />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: tokens.space.m, marginBottom: tokens.space.l }}>
        <Card style={{ padding: tokens.space.l }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.m }}>
            <DollarSign size={32} style={{ color: tokens.color.success }} />
            <div>
              <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>Total Earned</p>
              <p style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold }}>
                ${(totalEarned / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: tokens.space.l }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.m }}>
            <TrendingUp size={32} style={{ color: tokens.color.success }} />
            <div>
              <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>Captured</p>
              <p style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold }}>
                ${(totalCaptured / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: tokens.space.l }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.m }}>
            <AlertCircle size={32} style={{ color: tokens.color.warning }} />
            <div>
              <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>Pending</p>
              <p style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold }}>
                ${(pending / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card style={{ padding: tokens.space.l }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.m }}>
            <AlertCircle size={32} style={{ color: tokens.color.danger }} />
            <div>
              <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>Missed</p>
              <p style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold }}>
                ${(missed / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card style={{ padding: tokens.space.l }}>
        <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.m }}>
          Recent Events
        </h3>
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          {events.length === 0 ? (
            <p style={{ textAlign: 'center', padding: tokens.space.xl, color: tokens.color.text.secondary }}>
              No earnings events yet
            </p>
          ) : (
            events.map(event => (
              <div
                key={event.id}
                style={{
                  padding: tokens.space.m,
                  borderBottom: `1px solid ${tokens.color.text.secondary}20`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ fontWeight: tokens.typography.weight.semibold, textTransform: 'capitalize' }}>
                    {event.kind}
                  </p>
                  <p style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>
                    {new Date(event.occurred_at).toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: tokens.typography.weight.bold, color: event.captured ? tokens.color.success : tokens.color.warning }}>
                    ${(event.amount_cents / 100).toFixed(2)}
                  </p>
                  <p style={{ fontSize: tokens.typography.size.xs, color: tokens.color.text.secondary }}>
                    {event.captured ? 'Captured' : 'Pending'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
