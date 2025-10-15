/**
 * Learning Panel - Progress & metrics
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

export function LearningPanel() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Learned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Auto-Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">93%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Accuracy Over Time</CardTitle>
          <CardDescription>Success rate in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <TrendingUp className="h-12 w-12 opacity-30" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Corrections */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Recent Corrections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Learned family relationship</p>
                <p className="text-xs text-muted-foreground">Before: unknown → After: family_mom stored</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
