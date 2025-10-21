/**
 * Admin Rocker Tools Panel
 * Edge functions and admin utilities
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Play, Settings, Clock, Zap, Database, FileText, RefreshCw } from 'lucide-react';

export function ToolsPanel() {
  const tools = [
    {
      id: 1,
      name: 'Batch Moderation',
      description: 'Process multiple flagged items simultaneously',
      icon: Shield,
      status: 'ready',
      lastRun: '2 hours ago',
      category: 'moderation',
    },
    {
      id: 2,
      name: 'Data Cleanup',
      description: 'Remove old logs and optimize database',
      icon: Database,
      status: 'scheduled',
      lastRun: 'daily at 2:00 AM',
      category: 'maintenance',
    },
    {
      id: 3,
      name: 'Report Generator',
      description: 'Create custom analytics reports',
      icon: FileText,
      status: 'ready',
      lastRun: 'never',
      category: 'analytics',
    },
    {
      id: 4,
      name: 'Cache Refresh',
      description: 'Clear and rebuild application caches',
      icon: RefreshCw,
      status: 'ready',
      lastRun: '5 days ago',
      category: 'performance',
    },
  ];

  const automations = [
    {
      id: 1,
      name: 'Daily Analytics Email',
      schedule: 'Every day at 8:00 AM',
      status: 'active',
      nextRun: 'in 14 hours',
    },
    {
      id: 2,
      name: 'Weekly User Report',
      schedule: 'Every Monday at 9:00 AM',
      status: 'active',
      nextRun: 'in 3 days',
    },
    {
      id: 3,
      name: 'Content Moderation Sweep',
      schedule: 'Every 6 hours',
      status: 'active',
      nextRun: 'in 2 hours',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'default';
      case 'scheduled': return 'secondary';
      case 'active': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Tools & Utilities</h1>
        <p className="text-muted-foreground mt-1">
          Edge functions, scripts, and automation management
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center space-y-2">
            <Zap className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-semibold">Run Script</h3>
            <p className="text-xs text-muted-foreground">
              Execute admin-only utilities
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center space-y-2">
            <Clock className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-semibold">Schedule Job</h3>
            <p className="text-xs text-muted-foreground">
              Set up automated tasks
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center space-y-2">
            <Settings className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-semibold">Configure</h3>
            <p className="text-xs text-muted-foreground">
              Manage tool settings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Available Tools
          </CardTitle>
          <CardDescription>
            Admin-only edge functions and utilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{tool.name}</h3>
                          <Badge variant={getStatusColor(tool.status)}>
                            {tool.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tool.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tool.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last run: {tool.lastRun}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="default" className="gap-2">
                        <Play className="h-4 w-4" />
                        Run
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Automated Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automated Jobs
          </CardTitle>
          <CardDescription>
            Scheduled tasks and recurring processes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {automations.map((automation) => (
            <Card key={automation.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{automation.name}</h3>
                      <Badge variant={getStatusColor(automation.status)}>
                        {automation.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {automation.schedule}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Next run: {automation.nextRun}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="outline">Pause</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" className="w-full">
            + Add New Automation
          </Button>
        </CardContent>
      </Card>

      {/* Proactive Optimization */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Proactive Optimizations
          </CardTitle>
          <CardDescription>
            AI-suggested maintenance and improvements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Database optimization recommended</p>
            <p className="text-xs text-muted-foreground mt-1">
              Old logs detected (500MB) - cleanup will improve performance by ~15%
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Run Cleanup
            </Button>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Cache refresh suggested</p>
            <p className="text-xs text-muted-foreground mt-1">
              Application caches are 7 days old - refresh for improved load times
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Refresh Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
