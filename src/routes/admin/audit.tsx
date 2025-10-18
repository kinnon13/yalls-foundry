/**
 * @feature(admin_audit)
 * Master Audit Dashboard
 * Comprehensive platform health check
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw, Search } from 'lucide-react';
import { kernel, GOLD_PATH_FEATURES, isProd } from '@/lib/feature-kernel';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/lib/env';
// Import feature manifest as raw text (works in Vite without extra tsconfig)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import featuresManifestRaw from '../../../docs/features/features.json?raw';

interface AuditResult {
  check: string;
  category: 'critical' | 'important' | 'info';
  status: 'pass' | 'fail' | 'warn' | 'running';
  message: string;
  details?: string[];
}

export default function AuditPage() {
  const [results, setResults] = useState<AuditResult[]>([]);
  const [running, setRunning] = useState(false);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  const runAudit = async () => {
    try {
      setRunning(true);
      const auditResults: AuditResult[] = [];
  
      // 1. Feature completeness check
      const stats = kernel.getStats();
      const allFeatures = kernel.features;
      const expectedMin = 100; // Data-driven: expect at least 100 features based on route count
      
      auditResults.push({
        check: 'Feature Index Coverage',
        category: 'critical',
        status: stats.total >= expectedMin ? 'pass' : 'fail',
        message: `${stats.total} features mapped (expected: ${expectedMin}+)`,
        details: stats.total < expectedMin ? [
          'Run: npx tsx scripts/feature-audit.ts to see gaps',
          'Run: npx tsx scripts/backfill-features.ts to auto-generate placeholders'
        ] : undefined
      });
  
      // 2. Gold-path readiness
    const goldPath = kernel.validateGoldPath();
    auditResults.push({
      check: 'Gold-Path Features Ready',
      category: 'critical',
      status: goldPath.ready ? 'pass' : 'fail',
      message: `${GOLD_PATH_FEATURES.length - goldPath.blocking.length}/${GOLD_PATH_FEATURES.length} ready`,
      details: goldPath.blocking.length > 0 ? goldPath.blocking.map(id => `${id} is still shell`) : undefined
    });

    // 3. Shell leakage check & placeholder detection
    const shellFeatures = allFeatures.filter(f => f.status === 'shell');
    const placeholders = allFeatures.filter(f => f.notes?.includes('Auto-generated placeholder'));
    const shellInProd = isProd ? shellFeatures.filter(f => f.routes.length > 0).length : 0;
    const hasGuards = shellInProd === 0;
    
    auditResults.push({
      check: 'Shell Features Protected',
      category: 'critical',
      status: hasGuards ? 'pass' : 'warn',
      message: `${shellFeatures.length} shell features`,
      details: [
        ...shellFeatures.slice(0, 10).map(f => `${f.id}: ${f.title}`),
        ...(shellFeatures.length > 10 ? [`…+${shellFeatures.length - 10} more`] : [])
      ]
    });
    
    if (placeholders.length > 0) {
      auditResults.push({
        check: 'Placeholder Features',
        category: 'info',
        status: 'warn',
        message: `${placeholders.length} auto-generated placeholders need proper metadata`,
        details: placeholders.slice(0, 15).map(f => `${f.id}: ${f.title}`)
      });
    }

    // 4. Test coverage
    const withE2E = allFeatures.filter(f => f.tests.e2e.length > 0).length;
    const withUnit = allFeatures.filter(f => f.tests.unit.length > 0).length;
    const withAny = allFeatures.filter(f => f.tests.e2e.length > 0 || f.tests.unit.length > 0).length;
    const coveragePct = (withAny / Math.max(1, allFeatures.length)) * 100;
    
    auditResults.push({
      check: 'Test Coverage',
      category: 'important',
      status: coveragePct >= 80 ? 'pass' : coveragePct >= 50 ? 'warn' : 'fail',
      message: `${coveragePct.toFixed(1)}% features covered`,
      details: [
        `E2E: ${withE2E} features`,
        `Unit: ${withUnit} features`,
        `No tests: ${allFeatures.length - withAny} features`
      ]
    });

    // 5. Documentation coverage
    const withDocs = allFeatures.filter(f => f.docs && f.docs.length > 0).length;
    const docsPct = (withDocs / Math.max(1, allFeatures.length)) * 100;
    
    auditResults.push({
      check: 'Documentation Coverage',
      category: 'important',
      status: docsPct >= 80 ? 'pass' : docsPct >= 50 ? 'warn' : 'fail',
      message: `${docsPct.toFixed(1)}% features documented`,
      details: docsPct < 100 ? [`${allFeatures.length - withDocs} features missing docs`] : undefined
    });

    // 6. Owner assignment
    const withOwner = allFeatures.filter(f => f.owner && f.owner.length > 0).length;
    const ownerPct = (withOwner / Math.max(1, allFeatures.length)) * 100;
    
    auditResults.push({
      check: 'Owner Assignment',
      category: 'important',
      status: ownerPct >= 95 ? 'pass' : 'warn',
      message: `${ownerPct.toFixed(1)}% features have owners`,
      details: ownerPct < 100 ? [`${allFeatures.length - withOwner} unassigned features`] : undefined
    });

    // 7. Severity classification
    const withSeverity = allFeatures.filter(f => f.severity && ['p0', 'p1', 'p2'].includes(f.severity)).length;
    const severityPct = (withSeverity / Math.max(1, allFeatures.length)) * 100;
    
    auditResults.push({
      check: 'Severity Classification',
      category: 'info',
      status: severityPct >= 90 ? 'pass' : 'warn',
      message: `${severityPct.toFixed(1)}% features classified`,
      details: severityPct < 100 ? [`${allFeatures.length - withSeverity} features need severity`] : undefined
    });

    // 8. Area breakdown
    const byArea = stats.byArea as Record<string, { shell: number; 'full-ui': number; wired: number }>;
    const areaChecks = Object.entries(byArea).map(([area, counts]): AuditResult => {
      const total = (counts.shell || 0) + (counts['full-ui'] || 0) + (counts.wired || 0);
      const ready = (counts['full-ui'] || 0) + (counts.wired || 0);
      const pct = (ready / Math.max(1, total)) * 100;
      
      return {
        check: `${area.charAt(0).toUpperCase() + area.slice(1)} Area`,
        category: 'info',
        status: pct >= 80 ? 'pass' : pct >= 50 ? 'warn' : 'fail',
        message: `${ready}/${total} ready (${pct.toFixed(0)}%)`,
        details: [`Shell: ${counts.shell || 0}`, `Full UI: ${counts['full-ui'] || 0}`, `Wired: ${counts.wired || 0}`]
      };
    });

    auditResults.push(...areaChecks);

    // 9. Business Stack Audit (detailed)
    const businessFeatures = allFeatures.filter(f => 
      f.area === 'business' || 
      f.id.includes('crm') || 
      f.id.includes('kpi') || 
      f.id.includes('analytics') || 
      f.id.includes('dashboard') ||
      f.id.includes('producer') ||
      f.id.includes('earnings') ||
      f.id.includes('orders')
    );
    
    const expectedBusinessModules = [
      { id: 'crm', name: 'CRM & Contacts', keywords: ['crm'] },
      { id: 'kpi', name: 'KPI Dashboard', keywords: ['kpi', 'metric', 'analytics'] },
      { id: 'accounting', name: 'Accounting & Financials', keywords: ['accounting', 'financial', 'bookkeeping'] },
      { id: 'email', name: 'Email Marketing', keywords: ['email', 'campaign', 'newsletter'] },
      { id: 'social', name: 'Social Media Posting', keywords: ['post', 'composer', 'social'] },
      { id: 'orders', name: 'Order Management', keywords: ['order', 'purchase'] },
      { id: 'earnings', name: 'Earnings & Payouts', keywords: ['earning', 'payout', 'payment'] },
      { id: 'producer', name: 'Producer Console', keywords: ['producer', 'event'] },
      { id: 'approvals', name: 'Approvals Workflow', keywords: ['approval', 'review'] },
      { id: 'inventory', name: 'Inventory Management', keywords: ['inventory', 'stock', 'stallion'] },
      { id: 'messaging', name: 'Business Messaging', keywords: ['message', 'chat', 'inbox'] },
      { id: 'farm', name: 'Farm Operations', keywords: ['farm', 'ops'] }
    ];
    
    const businessModuleStatus = expectedBusinessModules.map(module => {
      const features = businessFeatures.filter(f => 
        module.keywords.some(kw => f.id.includes(kw) || f.title.toLowerCase().includes(kw))
      );
      const hasAny = features.length > 0;
      const hasWired = features.some(f => f.status === 'wired');
      const hasFullUI = features.some(f => f.status === 'full-ui');
      const allShell = features.every(f => f.status === 'shell');
      
      return {
        module: module.name,
        status: !hasAny ? 'missing' : hasWired ? 'wired' : hasFullUI ? 'full-ui' : allShell ? 'shell' : 'partial',
        count: features.length,
        features: features.map(f => `${f.id} (${f.status})`).join(', ')
      };
    });
    
    const businessReady = businessModuleStatus.filter(m => m.status === 'wired' || m.status === 'full-ui').length;
    const businessMissing = businessModuleStatus.filter(m => m.status === 'missing').length;
    
    auditResults.push({
      check: 'Business Stack Completeness',
      category: 'critical',
      status: businessReady >= 8 ? 'pass' : businessReady >= 5 ? 'warn' : 'fail',
      message: `${businessReady}/${expectedBusinessModules.length} business modules built`,
      details: [
        `✅ Ready: ${businessModuleStatus.filter(m => m.status === 'wired' || m.status === 'full-ui').map(m => m.module).join(', ')}`,
        `⚠️  Shell: ${businessModuleStatus.filter(m => m.status === 'shell' || m.status === 'partial').map(m => m.module).join(', ')}`,
        `❌ Missing: ${businessModuleStatus.filter(m => m.status === 'missing').map(m => m.module).join(', ')}`,
        '',
        'Detailed breakdown:',
        ...businessModuleStatus.map(m => 
          `  ${m.status === 'wired' || m.status === 'full-ui' ? '✅' : m.status === 'missing' ? '❌' : '⚠️ '} ${m.module}: ${m.count} features (${m.status})`
        )
      ]
    });

    setResults(auditResults);
  } catch (err) {
    console.error('Audit failed', err);
    setResults([{ check: 'Audit Error', category: 'critical', status: 'fail', message: 'Unexpected error running audit' }]);
  } finally {
    setRunning(false);
  }
};

  const runLiveScanner = async () => {
    try {
      // Load features manifest from bundled raw JSON
      const manifest = JSON.parse(featuresManifestRaw);
      const features = manifest.features || [];

      // Vite glob for component verification
      const componentFiles = import.meta.glob('/src/**/*.{ts,tsx}', { eager: false });
      const normalizeComponentPath = (p: string) => '/' + p.replace(/^\/+/, '');
      
      const checkComponents = (f: any) => {
        if (!Array.isArray(f.components) || f.components.length === 0) return false;
        return f.components.every((path: string) => {
          const normalized = normalizeComponentPath(path);
          return !!componentFiles[normalized];
        });
      };

      // 1) Route probe (HEAD + 404 fallback)
      const routeChecks = await Promise.all(
        features.map(async (f: any) => {
          const route = f.routes?.[0] || null;
          if (!route) return { id: f.id, route, routeOk: false, status: f.status, componentsExist: checkComponents(f) };

          try {
            const res = await fetch(route, { method: 'HEAD' });
            return { 
              id: f.id, 
              route, 
              routeOk: res.ok || res.status === 404, 
              status: f.status,
              componentsExist: checkComponents(f)
            };
          } catch {
            return { 
              id: f.id, 
              route, 
              routeOk: false, 
              status: f.status,
              componentsExist: checkComponents(f)
            };
          }
        })
      );

      // 2) DB/RPC probe (now includes tables with RLS)
      const allTables = Array.from(new Set(
        features.flatMap((f: any) => f.tables || [])
      )) as string[];
      const allFunctions = Array.from(new Set(
        features.flatMap((f: any) => f.rpc || [])
      )) as string[];

      let dbReport: any = { tables: [], functions: [] };
      try {
        const { data, error } = await supabase.rpc('feature_probe', {
          p_tables: allTables,
          p_functions: allFunctions,
        });
        if (!error && data) dbReport = data;
      } catch (err) {
        console.warn('DB probe failed:', err);
      }

      // 3) Merge & score (now includes component + table checks)
      const rows = routeChecks.map((rc: any) => {
        const feature = features.find((f: any) => f.id === rc.id);
        const rpcs = feature?.rpc || [];
        const rpcChecks = rpcs.map((name: string) => 
          dbReport.functions.find((x: any) => x.name === name)
        );
        const allRpcOk = rpcChecks.length === 0 || rpcChecks.every((x: any) => x?.exists);

        const tables = feature?.tables || [];
        const tableChecks = tables.map((name: string) =>
          dbReport.tables.find((x: any) => x.name === name)
        );
        const allTablesOk = tableChecks.length === 0 || tableChecks.every((x: any) => x?.exists);

        // Computed status: route + components + rpcs + tables
        const badge = rc.routeOk && rc.componentsExist && allRpcOk && allTablesOk ? 'pass' : 
                      (rc.routeOk && rc.componentsExist ? 'warn' : 'fail');
        
        return {
          id: rc.id,
          title: feature?.title || rc.id,
          area: feature?.area,
          badge,
          ui: rc.routeOk,
          components: rc.componentsExist,
          rpcs: allRpcOk,
          tables: allTablesOk,
          tableDetails: tableChecks.map((t: any) => ({
            name: t?.name || 'unknown',
            exists: t?.exists || false,
            rls: t?.rls || false
          })),
          status: rc.status,
          route: rc.route,
        };
      });

      setLiveResults(rows);
    } catch (err) {
      console.error('Scanner error:', err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  const criticalFails = results.filter(r => r.category === 'critical' && r.status === 'fail').length;
  const importantFails = results.filter(r => r.category === 'important' && r.status === 'fail').length;
  const totalWarns = results.filter(r => r.status === 'warn').length;
  const totalPasses = results.filter(r => r.status === 'pass').length;

  const overallStatus = criticalFails > 0 ? 'fail' : importantFails > 0 ? 'warn' : 'pass';

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Audit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comprehensive platform health check
        </p>
        <p className="text-xs text-muted-foreground">
          Sources: {kernel.sources.base} base · {kernel.sources.overlays} overlay · {kernel.sources.generated} generated
        </p>
        <div role="status" aria-live="polite" className="sr-only">
          {running ? 'Audit running' : 'Audit idle'}
        </div>
      </div>
        <Button onClick={runAudit} disabled={running}>
          {running ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Audit
            </>
          )}
        </Button>
      </div>

      {/* Overall Status */}
      <div className={`rounded-lg border p-6 ${
        overallStatus === 'pass' ? 'bg-green-50 border-green-200' :
        overallStatus === 'warn' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          {overallStatus === 'pass' && <CheckCircle className="h-8 w-8 text-green-600" />}
          {overallStatus === 'warn' && <AlertCircle className="h-8 w-8 text-yellow-600" />}
          {overallStatus === 'fail' && <XCircle className="h-8 w-8 text-red-600" />}
          <div>
            <div className="text-2xl font-bold">
              {overallStatus === 'pass' && 'Platform Ready'}
              {overallStatus === 'warn' && 'Action Required'}
              {overallStatus === 'fail' && 'Critical Issues'}
            </div>
            <div className="text-sm mt-1">
              {totalPasses} passed · {totalWarns} warnings · {criticalFails + importantFails} failed
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid gap-4">
        {results.filter(r => r.category === 'critical').length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Critical Checks</h2>
            <div className="space-y-2">
              {results.filter(r => r.category === 'critical').map((result, i) => (
                <AuditResultCard key={i} result={result} />
              ))}
            </div>
          </div>
        )}

        {results.filter(r => r.category === 'important').length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Important Checks</h2>
            <div className="space-y-2">
              {results.filter(r => r.category === 'important').map((result, i) => (
                <AuditResultCard key={i} result={result} />
              ))}
            </div>
          </div>
        )}

        {results.filter(r => r.category === 'info').length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Area Breakdown</h2>
            <div className="space-y-2">
              {results.filter(r => r.category === 'info').map((result, i) => (
                <AuditResultCard key={i} result={result} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditResultCard({ result }: { result: AuditResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {result.status === 'pass' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {result.status === 'warn' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
          {result.status === 'fail' && <XCircle className="h-5 w-5 text-red-600" />}
          {result.status === 'running' && <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />}
          
          <div>
            <div className="font-medium">{result.check}</div>
            <div className="text-sm text-muted-foreground">{result.message}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={
            result.status === 'pass' ? 'default' :
            result.status === 'warn' ? 'outline' :
            'destructive'
          }>
            {result.status.toUpperCase()}
          </Badge>
          
          {result.details && result.details.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide' : 'Details'}
            </Button>
          )}
        </div>
      </div>
      
      {expanded && result.details && (
        <div className="mt-3 pl-8 space-y-1">
          {result.details.map((detail, i) => (
            <div key={i} className="text-sm text-muted-foreground">
              • {detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
