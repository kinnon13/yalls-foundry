/**
 * Earnings Feature
 * 
 * Standalone earnings tracking feature
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { X } from 'lucide-react';
import type { FeatureProps } from '@/feature-kernel/types';

interface EarningsFeatureProps extends FeatureProps {
  tab?: 'summary' | 'missed' | 'history';
  featureId: string;
  updateProps: (updates: Partial<FeatureProps>) => void;
  close: () => void;
}

export default function EarningsFeature({
  tab = 'summary',
  featureId,
  updateProps,
  close,
}: EarningsFeatureProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Earnings</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['summary', 'missed', 'history'] as const).map((t) => (
                <Button
                  key={t}
                  variant={tab === t ? 'secondary' : 'ghost'}
                  size="s"
                  onClick={() => updateProps({ tab: t })}
                >
                  {t}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="s" onClick={close}>
              <X size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'summary' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-2xl font-bold">$12,450</p>
                <p className="text-xs text-green-500 mt-1">+15% this month</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-bold">$3,200</p>
                <p className="text-xs text-blue-500 mt-1">5 transactions</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <p className="text-sm text-muted-foreground mb-1">This Month</p>
                <p className="text-2xl font-bold">$4,800</p>
                <p className="text-xs text-purple-500 mt-1">12 sales</p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Recent Transactions</h4>
              <div className="space-y-2">
                {[
                  { id: '1', desc: 'Sale: Premium Listing #1234', amount: '$450', date: '2024-01-15', status: 'completed' },
                  { id: '2', desc: 'Commission: Referral Bonus', amount: '$120', date: '2024-01-14', status: 'pending' },
                  { id: '3', desc: 'Sale: Standard Listing #5678', amount: '$280', date: '2024-01-13', status: 'completed' },
                ].map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{txn.desc}</p>
                      <p className="text-xs text-muted-foreground">{txn.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">{txn.amount}</p>
                      <p className="text-xs text-muted-foreground">{txn.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'missed' && (
          <div className="text-center py-12 text-muted-foreground">
            <p>View missed opportunities and potential earnings</p>
            <p className="text-xs mt-2">No missed earnings to display</p>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Earnings History</h4>
              <Button variant="ghost" size="s">Export CSV</Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Date</th>
                    <th className="text-left p-3 text-sm font-medium">Description</th>
                    <th className="text-right p-3 text-sm font-medium">Amount</th>
                    <th className="text-right p-3 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t hover:bg-muted/50">
                      <td className="p-3 text-sm">2024-01-{15 - i}</td>
                      <td className="p-3 text-sm">Sale #{1234 + i}</td>
                      <td className="p-3 text-sm text-right font-medium">${(Math.random() * 500 + 100).toFixed(0)}</td>
                      <td className="p-3 text-sm text-right">
                        <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-500">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
