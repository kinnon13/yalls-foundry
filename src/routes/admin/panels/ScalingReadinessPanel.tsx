/**
 * Scaling Readiness Panel
 * 
 * Tracks app readiness for billion-user scale with phase-by-phase assessment
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScalingPhase {
  name: string;
  userRange: string;
  status: 'ready' | 'partial' | 'blocked';
  infrastructure: string;
  readiness: number;
  criticalIssues: string[];
  completed: string[];
  remaining: string[];
  monthlyCost: string;
}

export default function ScalingReadinessPanel() {
  const phases: ScalingPhase[] = [
    {
      name: 'Phase 1: Foundation',
      userRange: '0-100K users',
      status: 'partial',
      infrastructure: 'Lovable + Supabase Pro',
      readiness: 65,
      criticalIssues: [
        '354 console.log statements (security risk)',
        'In-memory state (not horizontally scalable)',
        'Hardcoded tenant_id (single-tenant only)',
        'Incomplete rate limiting (12 edge functions)',
      ],
      completed: [
        'Keyset pagination implemented',
        'Column projection optimized',
        'Basic RLS policies active',
        'Code audit system deployed',
      ],
      remaining: [
        'Remove all console.log statements',
        'Migrate state to Supabase tables',
        'Implement multi-tenancy',
        'Add Redis caching layer',
        'Complete rate limiting',
      ],
      monthlyCost: '$50-200',
    },
    {
      name: 'Phase 2: Growth',
      userRange: '100K-1M users',
      status: 'blocked',
      infrastructure: 'Supabase Enterprise + CDN',
      readiness: 20,
      criticalIssues: [
        'No database partitioning',
        'No CDN integration',
        'No distributed caching',
        'Single-region deployment',
      ],
      completed: [],
      remaining: [
        'Upgrade to Supabase Enterprise',
        'Implement table partitioning',
        'Integrate Cloudflare CDN',
        'Deploy Upstash Redis',
        'Add read replicas',
      ],
      monthlyCost: '$500-2K',
    },
    {
      name: 'Phase 3: Scale',
      userRange: '1M-10M users',
      status: 'blocked',
      infrastructure: 'AWS/GCP + Kubernetes',
      readiness: 5,
      criticalIssues: [
        'Must migrate OFF Lovable',
        'No microservices architecture',
        'No event-driven system',
        'No custom sharding',
      ],
      completed: [],
      remaining: [
        'Migrate to AWS/GCP',
        'Deploy Kubernetes clusters',
        'Implement microservices',
        'Add Kafka event bus',
        'Custom database sharding',
      ],
      monthlyCost: '$10K-50K',
    },
    {
      name: 'Phase 4: Massive Scale',
      userRange: '10M-100M users',
      status: 'blocked',
      infrastructure: 'Multi-region distributed',
      readiness: 0,
      criticalIssues: [
        'No multi-region support',
        'No CRDT implementation',
        'No owned infrastructure',
        'No advanced caching',
      ],
      completed: [],
      remaining: [
        'Multi-region deployment',
        'Eventually consistent data',
        'Multi-tier caching',
        'Custom data centers',
        'Advanced monitoring',
      ],
      monthlyCost: '$500K-2M',
    },
    {
      name: 'Phase 5: Billion Users',
      userRange: '100M-1B users',
      status: 'blocked',
      infrastructure: 'Twitter/X-level architecture',
      readiness: 0,
      criticalIssues: [
        'Requires custom data centers',
        'Needs proprietary tech stack',
        'Requires 200+ engineers',
        'Needs $100M+ capital',
      ],
      completed: [],
      remaining: [
        'Build custom data centers',
        'Develop proprietary message queue',
        '99%+ cache hit rate',
        'ML infrastructure',
        'Chaos engineering',
      ],
      monthlyCost: '$50M-200M/year',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'default';
      case 'partial': return 'secondary';
      case 'blocked': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'partial': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'blocked': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return null;
    }
  };

  const currentPhase = phases[0]; // Phase 1 is current

  return (
    <div className="space-y-6">
      {/* Critical Alert */}
      <Alert variant="destructive" className="border-destructive">
        <Target className="h-4 w-4" />
        <AlertDescription>
          <strong>Reality Check:</strong> True 1B-user scale (like Twitter/X) requires migrating OFF Lovable 
          to custom infrastructure at Phase 3 (~1M users). Current setup: ~10K-100K capacity.
        </AlertDescription>
      </Alert>

      {/* Current Phase Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Phase: Foundation (Phase 1)</CardTitle>
              <CardDescription>
                Building for 0-100K users · Lovable + Supabase
              </CardDescription>
            </div>
            <Badge variant={getStatusColor(currentPhase.status)}>
              {currentPhase.readiness}% Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Readiness Score</span>
              <span className="text-sm text-muted-foreground">
                {currentPhase.readiness}%
              </span>
            </div>
            <Progress value={currentPhase.readiness} />
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Completed ({currentPhase.completed.length})
              </h4>
              <ul className="text-sm space-y-1">
                {currentPhase.completed.map((item, idx) => (
                  <li key={idx} className="text-muted-foreground">✓ {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Critical Issues ({currentPhase.criticalIssues.length})
              </h4>
              <ul className="text-sm space-y-1">
                {currentPhase.criticalIssues.map((item, idx) => (
                  <li key={idx} className="text-destructive">⚠ {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Phases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Scaling Roadmap to 1 Billion Users
          </CardTitle>
          <CardDescription>
            Phase-by-phase infrastructure requirements and readiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="phase1" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {phases.map((phase, idx) => (
                <TabsTrigger key={idx} value={`phase${idx + 1}`} className="text-xs">
                  P{idx + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            {phases.map((phase, idx) => (
              <TabsContent key={idx} value={`phase${idx + 1}`} className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{phase.name}</h3>
                    <p className="text-sm text-muted-foreground">{phase.userRange}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(phase.status)}
                    <Badge variant={getStatusColor(phase.status)}>
                      {phase.readiness}% Ready
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="p-4 border rounded bg-muted/50">
                    <p className="text-sm">
                      <strong>Infrastructure:</strong> {phase.infrastructure}
                    </p>
                    <p className="text-sm">
                      <strong>Monthly Cost:</strong> {phase.monthlyCost}
                    </p>
                  </div>

                  {phase.criticalIssues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">🚨 Critical Blockers</h4>
                      <ul className="space-y-1">
                        {phase.criticalIssues.map((issue, i) => (
                          <li key={i} className="text-sm p-2 border-l-2 border-destructive bg-destructive/5 pl-3">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {phase.completed.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-success">✓ Completed</h4>
                      <ul className="space-y-1">
                        {phase.completed.map((item, i) => (
                          <li key={i} className="text-sm p-2 border-l-2 border-success bg-success/5 pl-3">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {phase.remaining.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">📋 Remaining Tasks</h4>
                      <ul className="space-y-1">
                        {phase.remaining.map((item, i) => (
                          <li key={i} className="text-sm p-2 border-l-2 border-muted-foreground bg-muted/30 pl-3">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Cost Projection */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Projection by Scale</CardTitle>
          <CardDescription>Infrastructure costs scale with user base</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { users: '10K', cost: '$50-200/mo', team: '1-2 devs' },
              { users: '100K', cost: '$500-2K/mo', team: '2-3 devs' },
              { users: '1M', cost: '$10K-50K/mo', team: '5-10 devs' },
              { users: '10M', cost: '$100K-500K/mo', team: '20-30 devs + SREs' },
              { users: '100M', cost: '$1M-5M/mo', team: '50-100 devs' },
              { users: '1B', cost: '$50M-200M/year', team: '200+ engineers' },
            ].map((tier, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-semibold">{tier.users} users</span>
                  <span className="text-sm text-muted-foreground ml-2">({tier.team})</span>
                </div>
                <span className="text-sm font-medium">{tier.cost}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
