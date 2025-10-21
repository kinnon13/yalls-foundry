/**
 * Admin Rocker Logs & Audits Panel
 * System logs and audit trail viewer
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollText, Search, Download, Filter, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export function LogsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [logType, setLogType] = useState('all');

  const logs = [
    {
      id: 1,
      type: 'info',
      action: 'User role updated',
      user: 'admin@example.com',
      target: 'user_id: 12345',
      details: 'Role changed from user to moderator',
      timestamp: '2024-01-20 14:32:15',
      ip: '192.168.1.100',
    },
    {
      id: 2,
      type: 'warning',
      action: 'Failed login attempt',
      user: 'unknown',
      target: 'email: suspicious@test.com',
      details: 'Multiple failed password attempts',
      timestamp: '2024-01-20 14:15:03',
      ip: '10.0.0.25',
    },
    {
      id: 3,
      type: 'success',
      action: 'Data export completed',
      user: 'admin@example.com',
      target: 'export_id: exp_789',
      details: 'User data exported (CSV, 1,234 records)',
      timestamp: '2024-01-20 13:45:22',
      ip: '192.168.1.100',
    },
    {
      id: 4,
      type: 'info',
      action: 'Campaign created',
      user: 'marketing@example.com',
      target: 'campaign_id: camp_456',
      details: 'Spring Stallion Showcase - 15% discount',
      timestamp: '2024-01-20 12:10:08',
      ip: '192.168.1.105',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'warning': return 'destructive';
      case 'success': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs & Audit Trails</h1>
        <p className="text-muted-foreground mt-1">
          Track system events and administrative actions
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Activity Logs
          </CardTitle>
          <CardDescription>
            Searchable audit trail with export capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by user, action, or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Log type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Logs Table */}
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getTypeIcon(log.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getTypeBadge(log.type)}>
                          {log.type}
                        </Badge>
                        <span className="font-medium text-sm">{log.action}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">User:</span> {log.user}
                        </div>
                        <div>
                          <span className="font-medium">Target:</span> {log.target}
                        </div>
                        <div>
                          <span className="font-medium">IP:</span> {log.ip}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {log.timestamp}
                        </div>
                      </div>
                      
                      <p className="text-sm">{log.details}</p>
                    </div>

                    <Button size="sm" variant="ghost">
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Security Alerts
          </CardTitle>
          <CardDescription>
            Proactive monitoring of suspicious activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Multiple failed login attempts detected</p>
              <p className="text-xs text-muted-foreground mt-1">
                5 failed attempts from IP 10.0.0.25 in the last hour
              </p>
            </div>
            <Button size="sm" variant="outline">Block IP</Button>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Unusual data export activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Large export request (10,000+ records) initiated by admin@example.com
              </p>
            </div>
            <Button size="sm" variant="outline">Review</Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Exports</CardTitle>
          <CardDescription>
            Schedule regular log backups and reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">Daily Audit Backup</p>
              <p className="text-xs text-muted-foreground">Exports at 2:00 AM daily</p>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">Weekly Security Report</p>
              <p className="text-xs text-muted-foreground">Sent every Monday</p>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
          
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add New Schedule
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
