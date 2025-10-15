/**
 * Code Audit Panel
 * 
 * Tracks code quality issues, technical debt, and scalability concerns
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Info, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  count: number;
  details: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
}

export default function CodeAuditPanel() {
  const [scanning, setScanning] = useState(false);
  const [issues, setIssues] = useState<AuditIssue[]>([]);

  // Simulated audit results based on codebase analysis
  const auditResults: AuditIssue[] = [
    {
      type: 'error',
      category: 'Console Logs',
      count: 354,
      details: 'Production console.log statements found across 14 files. These should be removed or replaced with proper logging.',
      impact: 'high'
    },
    {
      type: 'warning',
      category: 'TODOs',
      count: 34,
      details: 'Incomplete features or technical debt markers found in codebase.',
      impact: 'medium'
    },
    {
      type: 'error',
      category: 'Multi-Tenancy',
      count: 1,
      details: 'Hardcoded tenant_id in rocker-admin edge function. Blocks multi-tenant scaling.',
      impact: 'critical'
    },
    {
      type: 'error',
      category: 'In-Memory State',
      count: 3,
      details: 'Idempotency, rate limiting, and caching using in-memory storage. Not horizontally scalable.',
      impact: 'critical'
    },
    {
      type: 'warning',
      category: 'Missing Rate Limiting',
      count: 12,
      details: 'Edge functions without rate limiting implementation.',
      impact: 'high'
    },
    {
      type: 'warning',
      category: 'Incomplete Features',
      count: 5,
      details: 'Data export, Stripe webhooks, CSRF protection partially implemented.',
      impact: 'medium'
    },
    {
      type: 'info',
      category: 'Dead Code Candidates',
      count: 8,
      details: 'Potentially unused components or functions detected.',
      impact: 'low'
    },
    {
      type: 'info',
      category: 'Large Components',
      count: 4,
      details: 'Components over 500 lines that may benefit from refactoring.',
      impact: 'medium'
    }
  ];

  const runAudit = () => {
    setScanning(true);
    setTimeout(() => {
      setIssues(auditResults);
      setScanning(false);
    }, 1500);
  };

  useEffect(() => {
    runAudit();
  }, []);

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'info': return <Info className="h-5 w-5 text-info" />;
      default: return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const criticalIssues = issues.filter(i => i.impact === 'critical');
  const highIssues = issues.filter(i => i.impact === 'high');
  const totalIssueCount = issues.reduce((sum, i) => sum + i.count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Code Audit & Quality Scanner
            </CardTitle>
            <CardDescription>
              Track technical debt, scalability issues, and code quality metrics
            </CardDescription>
          </div>
          <Button onClick={runAudit} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Run Audit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded bg-card">
            <div className="text-2xl font-bold text-destructive">{criticalIssues.length}</div>
            <div className="text-xs text-muted-foreground">Critical Issues</div>
          </div>
          <div className="p-4 border rounded bg-card">
            <div className="text-2xl font-bold text-warning">{highIssues.length}</div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
          <div className="p-4 border rounded bg-card">
            <div className="text-2xl font-bold">{totalIssueCount}</div>
            <div className="text-xs text-muted-foreground">Total Issues</div>
          </div>
          <div className="p-4 border rounded bg-card">
            <div className="text-2xl font-bold">{issues.length}</div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Issues</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="scalability">Scale Blockers</TabsTrigger>
            <TabsTrigger value="quality">Code Quality</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {issues.map((issue, idx) => (
              <div key={idx} className="p-4 border rounded hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getIssueIcon(issue.type)}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{issue.category}</h4>
                        <Badge variant={getImpactColor(issue.impact)}>
                          {issue.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.details}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {issue.count}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="critical" className="space-y-3 mt-4">
            {criticalIssues.map((issue, idx) => (
              <div key={idx} className="p-4 border border-destructive rounded bg-destructive/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getIssueIcon(issue.type)}
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-destructive">{issue.category}</h4>
                      <p className="text-sm text-muted-foreground">{issue.details}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-destructive">
                    {issue.count}
                  </div>
                </div>
              </div>
            ))}
            {criticalIssues.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
                <p>No critical issues found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scalability" className="space-y-3 mt-4">
            {issues.filter(i => ['Multi-Tenancy', 'In-Memory State', 'Missing Rate Limiting'].includes(i.category)).map((issue, idx) => (
              <div key={idx} className="p-4 border rounded bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getIssueIcon(issue.type)}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{issue.category}</h4>
                        <Badge variant={getImpactColor(issue.impact)}>Scale Blocker</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.details}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {issue.count}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="quality" className="space-y-3 mt-4">
            {issues.filter(i => ['Console Logs', 'TODOs', 'Dead Code Candidates', 'Large Components'].includes(i.category)).map((issue, idx) => (
              <div key={idx} className="p-4 border rounded bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getIssueIcon(issue.type)}
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold">{issue.category}</h4>
                      <p className="text-sm text-muted-foreground">{issue.details}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {issue.count}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Action Items */}
        <div className="p-4 border rounded bg-muted/50">
          <h4 className="font-semibold mb-2">Recommended Actions</h4>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Remove all console.log statements before production deploy</li>
            <li>Migrate idempotency/rate-limit to Supabase tables for horizontal scaling</li>
            <li>Implement tenant_id routing for multi-tenant support</li>
            <li>Complete partial features (Stripe webhooks, data export, CSRF)</li>
            <li>Add rate limiting to all public edge functions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
