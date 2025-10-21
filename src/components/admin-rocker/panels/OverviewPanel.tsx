/**
 * Admin Rocker Overview Panel
 * Dashboard with key metrics and AI insights
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, Flag, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OverviewPanel() {
  const metrics = [
    { label: 'Active Users', value: '1,284', change: '+12%', icon: Users, color: 'text-green-500' },
    { label: 'Flagged Content', value: '23', change: '-5%', icon: Flag, color: 'text-red-500' },
    { label: 'System Uptime', value: '99.9%', change: 'stable', icon: CheckCircle, color: 'text-blue-500' },
    { label: 'Active Campaigns', value: '8', change: '+2', icon: TrendingUp, color: 'text-orange-500' },
  ];

  const recentAlerts = [
    { id: 1, type: 'warning', message: 'High engagement drop in farm section', time: '2 hours ago' },
    { id: 2, type: 'info', message: 'New user milestone: 10,000 members', time: '5 hours ago' },
    { id: 3, type: 'warning', message: '15 flagged posts awaiting review', time: '1 day ago' },
  ];

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Rocker Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor platform health, review alerts, and manage operations
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.change} from last week
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Insights Panel */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            AI-Generated Insights
          </CardTitle>
          <CardDescription>
            Proactive suggestions and trends identified by Admin Rocker AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Top 5 Trending Issues Today</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Increased spam reports in marketplace (↑ 34%)</li>
              <li>• User engagement spike in stallion listings (↑ 28%)</li>
              <li>• Payment processing delays reported (3 incidents)</li>
              <li>• Mobile app login issues (resolved 2h ago)</li>
              <li>• High activity in equine event registrations</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="default">
              Generate Full Report
            </Button>
            <Button size="sm" variant="outline">
              Schedule Daily Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
          <CardDescription>Proactive notifications and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`h-2 w-2 rounded-full mt-2 ${
                  alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
                <Button size="sm" variant="ghost">View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Flag className="h-5 w-5" />
            <span className="text-xs">Review Flags</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Users className="h-5 w-5" />
            <span className="text-xs">User Management</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs">Create Campaign</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Activity className="h-5 w-5" />
            <span className="text-xs">Export Report</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
