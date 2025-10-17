/**
 * Earnings Dashboard
 * Show earnings ledger, events, and recompute
 */

import { useEarnings } from '@/hooks/useEarnings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function EarningsPage() {
  const { ledger, events, isLoading, recompute } = useEarnings();

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Earnings</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => recompute.mutate()}
          disabled={recompute.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${recompute.isPending ? 'animate-spin' : ''}`} />
          Recompute
        </Button>
      </div>

      {/* Ledger Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total Earned</span>
          </div>
          <div className="text-2xl font-bold">
            {ledger ? formatCents(ledger.total_earned_cents) : '$0.00'}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Captured</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {ledger ? formatCents(ledger.total_captured_cents) : '$0.00'}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {ledger ? formatCents(ledger.pending_cents) : '$0.00'}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <span className="text-sm text-muted-foreground">Missed</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {ledger ? formatCents(ledger.missed_cents) : '$0.00'}
          </div>
        </Card>
      </div>

      {/* Events Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Earnings History</h2>
        
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        )}

        {!isLoading && events.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No earnings yet
          </div>
        )}

        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">{event.kind}</span>
                  {event.captured && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(event.occurred_at), { addSuffix: true })}
                </p>
              </div>
              <div className={`text-lg font-bold ${event.captured ? 'text-green-600' : 'text-yellow-600'}`}>
                {formatCents(event.amount_cents)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
