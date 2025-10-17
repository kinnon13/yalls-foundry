/**
 * Earnings Dashboard (Task 24)
 * Production-grade earnings UI with Mac polish
 */

import { useEarnings } from '@/hooks/useEarnings';
import { Skeleton } from '@/components/system/Skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { normalizeError } from '@/lib/errors';
import { toast } from 'sonner';

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function EarningsPage() {
  const { ledger, events, isLoading, recompute } = useEarnings();

  const handleRecompute = async () => {
    try {
      await recompute.mutateAsync();
      toast.success('Earnings recalculated');
    } catch (e) {
      const err = normalizeError(e);
      toast.error(err.rateLimited ? 'Too many requests. Wait a moment.' : 'Failed to recompute');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Earnings</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecompute}
            disabled={recompute.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${recompute.isPending ? 'animate-spin' : ''}`} />
            Recompute
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Total Earned"
            value={formatCents(ledger?.total_earned_cents ?? 0)}
            variant="primary"
          />
          <MetricCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Captured"
            value={formatCents(ledger?.total_captured_cents ?? 0)}
            variant="success"
          />
          <MetricCard
            icon={<Clock className="h-5 w-5" />}
            label="Pending"
            value={formatCents(ledger?.pending_cents ?? 0)}
            variant="warning"
          />
          <MetricCard
            icon={<AlertCircle className="h-5 w-5" />}
            label="Missed"
            value={formatCents(ledger?.missed_cents ?? 0)}
            variant="muted"
          />
        </div>

        {/* Events Timeline */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h2 className="font-medium text-card-foreground">Transaction History</h2>
          </div>
          {events.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No earnings yet. Start selling to see your transactions here.
            </div>
          ) : (
            <div className="divide-y">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize text-card-foreground">
                        {event.kind.replace('_', ' ')}
                      </span>
                      {event.captured && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          Captured
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.occurred_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-foreground">
                      {formatCents(event.amount_cents)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: 'primary' | 'success' | 'warning' | 'muted';
}

function MetricCard({ icon, label, value, variant }: MetricCardProps) {
  const variantStyles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-card-foreground">{value}</div>
        </div>
        <div className={`rounded-lg p-2.5 ${variantStyles[variant]}`}>{icon}</div>
      </div>
    </div>
  );
}
