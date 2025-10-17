import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

type Row = {
  id: string;
  created_at: string;
  line: 'business_onboarder' | 'buyer' | 'seller';
  basis_cents: number;
  captured_cents: number;
  missed_cents: number;
};

type Tab = 'summary' | 'missed' | 'history';

export default function EarningsPanel() {
  const { session } = useSession();
  const [tab, setTab] = useState<Tab>('summary');
  const [rows, setRows] = useState<Row[]>([]);
  const [tierPct, setTierPct] = useState<number>(0.01);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!session?.userId) return;

      const { data: rows, error: err1 } = await (supabase as any)
        .from('earnings_events')
        .select('*')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false });
      if (err1) { console.error(err1); return; }

      const { data: tierRow, error: err2 } = await (supabase as any)
        .from('earnings_tiers')
        .select('pct')
        .eq('user_id', session.userId)
        .maybeSingle();
      if (!err2 && tierRow) setTierPct(tierRow.pct);

      // Get preview for demonstration
      const { data: preview } = await supabase.rpc('earnings_preview' as any, {
        p_user_id: session.userId,
        p_event: { basis_cents: 10000, target_pct: 0.04 }
      });
      if (preview) {
        console.log('[Earnings] Preview:', preview);
      }

      setRows((rows || []) as Row[]);
      setLoading(false);
    };
    load();
  }, [session?.userId]);

  const tierLabel = `${(tierPct * 100).toFixed(1)}%`;
  const totalCaptured = rows.reduce((a, r) => a + r.captured_cents, 0) / 100;
  const recentMissed =
    rows
      .filter((r) => Date.now() - Date.parse(r.created_at) < 30 * 864e5)
      .reduce((a, r) => a + r.missed_cents, 0) / 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Earnings</h1>
          <p className="text-muted-foreground">Track commissions and payouts</p>
        </div>
        <div className="flex gap-2">
          {(['summary', 'missed', 'history'] as Tab[]).map((t) => (
            <Button
              key={t}
              variant={tab === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {tab === 'summary' && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Capture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tierLabel}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${totalCaptured.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Missed (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                ${recentMissed.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'missed' && (
        <Card>
          <CardHeader>
            <CardTitle>Missed Earnings (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Current Tier</p>
                  <p className="text-lg font-semibold">{tierLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Could have earned</p>
                  <p className="text-2xl font-bold text-destructive">
                    +${recentMissed.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">at 4% (Tier 2)</p>
                </div>
              </div>
              <Button className="w-full">
                <TrendingUp size={16} className="mr-2" />
                Upgrade to Capture More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Date</th>
                    <th className="p-3 text-left text-sm font-medium">Line</th>
                    <th className="p-3 text-right text-sm font-medium">Basis</th>
                    <th className="p-3 text-right text-sm font-medium">Captured</th>
                    <th className="p-3 text-right text-sm font-medium">Missed</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        No earnings yet.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-sm">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm capitalize">
                        {r.line.replace(/_/g, ' ')}
                      </td>
                      <td className="p-3 text-sm text-right">
                        ${(r.basis_cents / 100).toFixed(2)}
                      </td>
                      <td className="p-3 text-sm text-right font-medium">
                        ${(r.captured_cents / 100).toFixed(2)}
                      </td>
                      <td className="p-3 text-sm text-right text-destructive">
                        ${(r.missed_cents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
