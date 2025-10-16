import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { useSession } from '@/lib/auth/context';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface OutcomeRow { action: string; target: string; success: boolean; created_at: string; user_id: string; route?: string | null; }
interface MemoryRow { route: string; target_name: string; selector: string; score: number; successes: number; failures: number; last_success_at: string | null; }
interface ComposerStatsRow { day: string; accept_rate: number; total: number; }

export default function LearningDashboard() {
  const { session } = useSession();
  const { isAdmin, isLoading } = useAdminCheck();

  const [loading, setLoading] = useState(true);
  const [recentOutcomes, setRecentOutcomes] = useState<OutcomeRow[]>([]);
  const [heatmap, setHeatmap] = useState<{ user_id: string; target: string; fails: number; succ: number }[]>([]);
  const [memory, setMemory] = useState<MemoryRow[]>([]);
  const [composerStats, setComposerStats] = useState<ComposerStatsRow[]>([]);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (!session?.userId) return;
    (async () => {
      setLoading(true);
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [outRes, weekRes, memRes, compRes] = await Promise.all([
        supabase
          .from('ai_feedback')
          .select('action,target,success,created_at,user_id,route')
          .gte('created_at', dayAgo)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('ai_feedback')
          .select('action,target,success,created_at,user_id')
          .gte('created_at', weekAgo)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('ai_selector_memory')
          .select('route,target_name,selector,score,successes,failures,last_success_at')
          .order('last_success_at', { ascending: false, nullsFirst: false })
          .limit(50),
        supabase
          .from('ai_feedback')
          .select('created_at,success')
          .eq('action', 'composer_suggestion')
          .gte('created_at', weekAgo)
          .order('created_at', { ascending: true }),
      ]);

      setRecentOutcomes((outRes.data as any) || []);

      // Aggregate per-user heat (client-side)
      const map = new Map<string, { user_id: string; target: string; fails: number; succ: number }>();
      for (const r of ((weekRes.data as any) || []) as OutcomeRow[]) {
        const key = `${r.user_id}|${r.target}`;
        const entry = map.get(key) || { user_id: r.user_id, target: r.target, fails: 0, succ: 0 };
        if (r.success) entry.succ++; else entry.fails++;
        map.set(key, entry);
      }
      setHeatmap(Array.from(map.values()).sort((a, b) => b.fails - a.fails).slice(0, 30));

      setMemory((memRes.data as any) || []);

      // Aggregate composer stats by day
      const compData = (compRes.data as any) || [];
      const dayMap = new Map<string, { accepts: number; total: number }>();
      for (const r of compData) {
        const day = new Date(r.created_at).toISOString().split('T')[0];
        const entry = dayMap.get(day) || { accepts: 0, total: 0 };
        entry.total++;
        if (r.success) entry.accepts++;
        dayMap.set(day, entry);
      }
      const stats = Array.from(dayMap.entries()).map(([day, { accepts, total }]) => ({
        day,
        accept_rate: total > 0 ? accepts / total : 0,
        total
      })).sort((a, b) => a.day.localeCompare(b.day));
      setComposerStats(stats);

      setLoading(false);
    })();
  }, [session?.userId]);

  const groupedRecent = useMemo(() => {
    const map = new Map<string, { action: string; target: string; success: boolean; count: number }>();
    for (const r of recentOutcomes) {
      const key = `${r.action}|${r.target}|${r.success}`;
      const entry = map.get(key) || { action: r.action, target: r.target, success: r.success, count: 0 };
      entry.count++;
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 30);
  }, [recentOutcomes]);

  if (!session) return <Navigate to="/login" replace />;
  if (isLoading) return <div className="min-h-screen p-6"><Skeleton className="h-24 w-full" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <>
      <SEOHelmet
        title="Learning Dashboard | Admin"
        description="Admin Learning Dashboard: recent outcomes, failure heatmap, selector memory"
      />
      <main className="min-h-screen p-6">
        <header className="max-w-6xl mx-auto py-6">
          <h1 className="text-3xl font-bold">Learning Dashboard</h1>
          <p className="text-muted-foreground">Track DOM action outcomes and selector learning in near real-time.</p>
        </header>

        <section className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Composer Coach Acceptance Rate (7d)</CardTitle>
              <CardDescription>Track how often users accept AI writing suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : composerStats.length === 0 ? (
                <p className="text-muted-foreground">No composer suggestions yet</p>
              ) : (
                <div className="space-y-2">
                  {composerStats.map((stat) => (
                    <div key={stat.day} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{stat.day}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {(stat.accept_rate * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({stat.total} suggestions)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Outcomes (24h)</CardTitle>
              <CardDescription>Top actions by frequency in the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedRecent.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{r.action}</TableCell>
                        <TableCell>{r.target}</TableCell>
                        <TableCell>{r.success ? '✅ Success' : '❌ Fail'}</TableCell>
                        <TableCell className="text-right">{r.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Per-user Fail Heat (7d)</CardTitle>
                <CardDescription>Users and targets with most failures</CardDescription>
              </div>
              <Button
                variant="outline"
                disabled={simulating}
                onClick={async () => {
                  try {
                    setSimulating(true);
                    const { data: { session } } = await supabase.auth.getSession();
                    const uid = session?.user?.id;
                    if (!uid) throw new Error('No user');
                    await supabase.functions.invoke('rocker-telemetry', {
                      body: {
                        user_id: uid,
                        route: window.location.pathname,
                        action: 'fill',
                        target: '__nonexistent__',
                        success: false,
                        message: 'Simulated failure from Learning Dashboard',
                        meta: { simulated: true },
                      },
                    });
                  } finally {
                    setSimulating(false);
                  }
                }}
              >
                {simulating ? 'Simulating…' : 'Simulate Failure'}
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead className="text-right">Fails</TableHead>
                      <TableHead className="text-right">Successes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {heatmap.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
                        <TableCell>{r.target}</TableCell>
                        <TableCell className="text-right">{r.fails}</TableCell>
                        <TableCell className="text-right">{r.succ}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="max-w-6xl mx-auto mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Selector Memory Status</CardTitle>
              <CardDescription>Recent selectors and scores</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Selector</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">S/F</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memory.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{m.route}</TableCell>
                        <TableCell>{m.target_name}</TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-[380px]">{m.selector}</TableCell>
                        <TableCell className="text-right">{m.score.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{m.successes}/{m.failures}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
