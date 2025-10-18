/**
 * @feature(admin_features)
 * Feature Index Admin Page
 * Complete feature management with sub-features
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import featuresManifestRaw from '../../../docs/features/features.json?raw';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { kernel, GOLD_PATH_FEATURES, Feature } from '@/lib/feature-kernel';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Shield, AlertCircle, Download, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, Scan } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FeatureCard } from '@/components/admin/FeatureCard';
import { FeatureEditorDialog } from '@/components/admin/FeatureEditorDialog';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_number: number;
}

interface Job {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string | null;
  html_url: string;
  steps: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    number: number;
  }>;
}

type FeatureStatus = 'shell' | 'full-ui' | 'wired';

interface ScanChecks {
  routeReachable: boolean;
  componentsExist: boolean;
  rpcs: { name: string; exists: boolean; security_definer?: boolean; arg_count?: number }[];
  tables: { name: string; exists: boolean; rls: boolean }[];
  rlsProbes?: { table: string; userCanRead: boolean }[];
}

interface ScannedFeature extends Feature {
  computed?: FeatureStatus;
  checks?: ScanChecks;
}

// Area aliases for canonical naming
const AREA_ALIASES: Record<string, string> = {
  dashboard: 'business',
  biz: 'business',
  shop: 'marketplace',
};

// Format area names nicely
const startCase = (s: string) =>
  s.replace(/[_-]/g, ' ')
   .replace(/\b\w/g, c => c.toUpperCase());

const labelForArea = (a: string) => startCase(AREA_ALIASES[a] ?? a);

export default function FeaturesAdminPage() {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [addingSubFeatureTo, setAddingSubFeatureTo] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [repoInfo, setRepoInfo] = useState({ owner: '', repo: '' });
  const [showTests, setShowTests] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scannedFeatures, setScannedFeatures] = useState<Map<string, ScannedFeature>>(new Map());
  const [showScanner, setShowScanner] = useState(false);
  const [sortBy, setSortBy] = useState<'status' | 'area'>('area');
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());

  const features = kernel.features;
  const goldPath = kernel.validateGoldPath();
  const stats = kernel.getStats();
  const isProd = import.meta.env.PROD;

  const filtered = useMemo(() => {
    return features.filter(f => {
      const canonArea = AREA_ALIASES[f.area] ?? f.area;
      const matchesSearch =
        search === '' ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase());
      const matchesArea = areaFilter === 'all' || canonArea === areaFilter;
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchesOwner = ownerFilter === 'all' || f.owner === ownerFilter;
      const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
      const isPlaceholder = f.notes?.includes('Auto-generated placeholder');
      const matchesPlaceholder = !showPlaceholders || isPlaceholder;
      return matchesSearch && matchesArea && matchesStatus && matchesOwner && matchesSeverity && matchesPlaceholder;
    });
  }, [features, search, areaFilter, statusFilter, ownerFilter, severityFilter, showPlaceholders]);

  const sorted = useMemo(() => {
    const result = [...filtered];
    if (sortBy === 'area') {
      result.sort((a, b) => {
        const aArea = AREA_ALIASES[a.area] ?? a.area;
        const bArea = AREA_ALIASES[b.area] ?? b.area;
        return aArea.localeCompare(bArea) || a.title.localeCompare(b.title);
      });
    } else {
      const statusOrder = { 'wired': 0, 'full-ui': 1, 'shell': 2 };
      result.sort((a, b) => {
        const aStatus = statusOrder[a.status as keyof typeof statusOrder] ?? 99;
        const bStatus = statusOrder[b.status as keyof typeof statusOrder] ?? 99;
        return aStatus - bStatus || a.title.localeCompare(b.title);
      });
    }
    return result;
  }, [filtered, sortBy]);

  const counts = useMemo(() => {
    const shell = filtered.filter(f => f.status === 'shell').length;
    const fullUi = filtered.filter(f => f.status === 'full-ui').length;
    const wired = filtered.filter(f => f.status === 'wired').length;
    const goldPathIds = new Set(GOLD_PATH_FEATURES);
    const goldPathCount = filtered.filter(f => goldPathIds.has(f.id)).length;
    const blockingCount = filtered.filter(f => f.severity === 'p0').length;
    return { shell, fullUi, wired, goldPathCount, blockingCount };
  }, [filtered]);

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature);
    setAddingSubFeatureTo(null);
    setEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingFeature(null);
    setAddingSubFeatureTo(null);
    setEditorOpen(true);
  };

  const handleAddSubFeature = (parentId: string) => {
    setEditingFeature(null);
    setAddingSubFeatureTo(parentId);
    setEditorOpen(true);
  };

  const handleDelete = (featureId: string) => {
    if (confirm(`Are you sure you want to delete feature "${featureId}"?`)) {
      toast.success(`Deleted ${featureId}`, {
        description: 'In production, this would remove the feature from features.json'
      });
    }
  };

  const handleSaveFeature = (featureData: Partial<Feature>) => {
    if (editingFeature) {
      toast.success(`Updated ${featureData.id}`, {
        description: 'Changes saved. In production, this would update features.json'
      });
    } else {
      toast.success(`Created ${featureData.id}`, {
        description: 'Feature created. In production, this would add to features.json'
      });
    }
    setEditorOpen(false);
    setEditingFeature(null);
    setAddingSubFeatureTo(null);
  };

  const handleExportJSON = () => {
    const data = JSON.stringify({ features: filtered }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `features-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported features to JSON');
  };

  const handleExportScanResults = () => {
    if (scannedFeatures.size === 0) {
      toast.error('No scan results to export');
      return;
    }

    const featuresToExport = selectedForExport.size > 0 
      ? Array.from(scannedFeatures.values()).filter(f => selectedForExport.has(f.id))
      : Array.from(scannedFeatures.values());

    if (featuresToExport.length === 0) {
      toast.error('No features selected for export');
      return;
    }

    const scanData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFeatures: featuresToExport.length,
        byComputedStatus: {
          shell: 0,
          'full-ui': 0,
          wired: 0,
        },
        issues: {
          missingRoutes: 0,
          missingComponents: 0,
          missingRpcs: 0,
          missingTables: 0,
          tablesWithoutRls: 0,
        }
      },
      features: [] as any[],
    };

    featuresToExport.forEach(f => {
      // Update summary counts
      if (f.computed) {
        scanData.summary.byComputedStatus[f.computed]++;
      }
      if (f.checks) {
        if (!f.checks.routeReachable) scanData.summary.issues.missingRoutes++;
        if (!f.checks.componentsExist) scanData.summary.issues.missingComponents++;
        if (f.checks.rpcs.some(r => !r.exists)) scanData.summary.issues.missingRpcs++;
        if (f.checks.tables.some(t => !t.exists)) scanData.summary.issues.missingTables++;
        if (f.checks.tables.some(t => t.exists && !t.rls)) scanData.summary.issues.tablesWithoutRls++;
      }

      scanData.features.push({
        id: f.id,
        title: f.title,
        area: f.area,
        status: f.status,
        computed: f.computed,
        checks: f.checks,
        routes: f.routes || [],
        components: (f as any).components || [],
        rpc: (f as any).rpc || [],
        tables: (f as any).tables || [],
      });
    });

    const blob = new Blob([JSON.stringify(scanData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feature-scan-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${featuresToExport.length} feature(s) to JSON`);
  };

  const handleSelectAll = () => {
    setSelectedForExport(new Set(Array.from(scannedFeatures.keys())));
  };

  const handleSelectNone = () => {
    setSelectedForExport(new Set());
  };

  const handleToggleFeature = (featureId: string) => {
    const newSelection = new Set(selectedForExport);
    if (newSelection.has(featureId)) {
      newSelection.delete(featureId);
    } else {
      newSelection.add(featureId);
    }
    setSelectedForExport(newSelection);
  };

  const fetchTestResults = async () => {
    setTestLoading(true);
    try {
      const owner = prompt('Enter GitHub username/org:', repoInfo.owner || '');
      const repo = prompt('Enter repository name:', repoInfo.repo || '');
      
      if (!owner || !repo) {
        toast.error('GitHub repository info required');
        return;
      }

      setRepoInfo({ owner, repo });

      const { data, error } = await supabase.functions.invoke('github-test-results', {
        body: { owner, repo },
      });

      if (error) throw error;

      setRuns(data.runs || []);
      setLatestJobs(data.latestJobs || []);
      toast.success('Test results loaded');
    } catch (error: any) {
      console.error('Failed to fetch test results:', error);
      toast.error(error.message || 'Failed to load test results');
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('github-repo-info');
    if (saved) {
      const info = JSON.parse(saved);
      setRepoInfo(info);
    }
  }, []);

  useEffect(() => {
    if (repoInfo.owner && repoInfo.repo) {
      localStorage.setItem('github-repo-info', JSON.stringify(repoInfo));
    }
  }, [repoInfo]);

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === 'in_progress' || status === 'queued') {
      return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
    }
    if (conclusion === 'success') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (conclusion === 'failure') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (status: string, conclusion: string | null) => {
    if (status === 'in_progress' || status === 'queued') {
      return <Badge variant="outline" className="bg-blue-50">Running</Badge>;
    }
    if (conclusion === 'success') {
      return <Badge variant="default" className="bg-green-500">Passed</Badge>;
    }
    if (conclusion === 'failure') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="outline">{conclusion || status}</Badge>;
  };

  const latestRun = runs[0];

  // Scanner logic
  const checkComponents = useCallback((f: any) => {
    return !!(f.components && f.components.length);
  }, []);

  const probeRoutes = useCallback(async (routes: string[]) => {
    const out: Record<string, boolean> = {};
    await Promise.all(routes.map(async (r) => {
      try {
        const res = await fetch(r, { method: 'HEAD', cache: 'no-store' });
        out[r] = res.ok || res.status === 404; // 404 means route exists in router
      } catch { 
        out[r] = false; 
      }
    }));
    return out;
  }, []);

  const computeStatus = useCallback((hasRoute: boolean, hasComponents: boolean, rpcAll: boolean): FeatureStatus => {
    if (hasRoute && hasComponents && rpcAll) return 'wired';
    if (hasRoute && hasComponents) return 'full-ui';
    return 'shell';
  }, []);

  const runFeatureScan = useCallback(async () => {
    setScanLoading(true);
    console.log('[Scanner] Starting comprehensive database + codebase scan...');
    try {
      // Load manifest from bundled raw JSON
      const manifest = JSON.parse(featuresManifestRaw);
      
      // Step 1: Get routes from registry (fallback to glob)
      let discoveredRoutes: string[] = [];
      try {
        const { getRegisteredRoutes } = await import('@/router/registry');
        discoveredRoutes = getRegisteredRoutes();
        console.log('[Scanner] Got routes from registry:', discoveredRoutes.length);
      } catch {
        // Fallback: widen globs to catch more route files
        const routeFiles = import.meta.glob([
          '/src/routes/**/*.{tsx,ts}',
          '/src/pages/**/*.{tsx,ts}',
        ], { eager: false });
        
        discoveredRoutes = Object.keys(routeFiles).map(path => {
          return path
            .replace('/src/routes', '')
            .replace('/src/pages', '')
            .replace(/\.tsx?$/, '')
            .replace(/\/index$/, '')
            .replace(/\[([^\]]+)\]/g, ':$1') // Convert [id] to :id
            || '/';
        });
        console.log('[Scanner] Fallback glob discovery:', discoveredRoutes.length);
      }
      
      if (!discoveredRoutes.includes('/')) discoveredRoutes.push('/');

      // Step 2: Discover all components for verification
      const allComponentFiles = import.meta.glob('/src/**/*.{tsx,ts}', { eager: false });

      // Step 3: Collect items from features.json (including sub-features)
      const documentedRpcs = new Set<string>();
      const documentedTables = new Set<string>();
      const documentedRoutes = new Set<string>();
      const rlsReadTables = new Set<string>();

      const walkFeature = (f: any) => {
        (f.rpc || []).forEach((r: string) => documentedRpcs.add(r));
        (f.tables || []).forEach((t: string) => documentedTables.add(t));
        (f.routes || []).forEach((r: string) => documentedRoutes.add(r));
        (f.rls_read_tables || []).forEach((t: string) => rlsReadTables.add(t));
        // Recurse into sub-features
        if (f.subFeatures) {
          f.subFeatures.forEach(walkFeature);
        }
      };

      for (const f of manifest.features) {
        walkFeature(f);
      }

      // Step 4: Send everything to edge function with introspectAll flag
      const inputs = {
        rpcs: [...documentedRpcs],
        tables: [...documentedTables],
        routes: [...new Set([...discoveredRoutes, ...documentedRoutes])],
        rls_read_tables: [...rlsReadTables],
        introspectAll: true, // Tell edge function to discover ALL tables/RPCs in DB
      };

      console.log('[Scanner] Comprehensive scan inputs:', {
        documentedRpcs: documentedRpcs.size,
        documentedTables: documentedTables.size,
        totalRoutes: inputs.routes.length,
        discoveredRoutes: discoveredRoutes.length,
        rlsReadTables: rlsReadTables.size,
        componentFiles: Object.keys(allComponentFiles).length,
        introspectAll: true
      });

      console.log('[Scanner] Invoking feature-scan edge function...');
      const { data, error } = await supabase.functions.invoke('feature-scan', {
        body: inputs
      });

      if (error) {
        console.error('[Scanner] Edge function error:', error);
        throw error;
      }

      console.log('[Scanner] Edge function response:', data);

      // Step 5: Compute undocumented items
      const rpcScan = (data?.rpcs ?? []).map((x: any) => x.name);
      const tableScan = (data?.tables ?? []).map((x: any) => x.name);
      
      const undocumentedRoutes = discoveredRoutes.filter(r => !documentedRoutes.has(r));
      const undocumentedRpcs = rpcScan.filter((n: string) => !documentedRpcs.has(n));
      const undocumentedTables = tableScan.filter((n: string) => !documentedTables.has(n));

      console.log('[Scanner] Undocumented items:', {
        routes: undocumentedRoutes.length,
        rpcs: undocumentedRpcs.length,
        tables: undocumentedTables.length,
      });

      // Store undocumented items in state for display
      (window as any).__undocumented = {
        routes: undocumentedRoutes,
        rpcs: undocumentedRpcs,
        tables: undocumentedTables,
      };

      const rpcMap = new Map<string, { exists: boolean; security_definer?: boolean }>();
      for (const r of (data?.rpcs ?? [])) {
        rpcMap.set(r.name, { 
          exists: !!r.exists,
          security_definer: r.security_definer
        });
      }
      
      const tableMap = new Map<string, {exists: boolean; rls: boolean}>();
      for (const t of (data?.tables ?? [])) {
        tableMap.set(t.name, { exists: !!t.exists, rls: !!t.rls });
      }

      const userProbeMap = new Map<string, boolean>();
      for (const [tbl, ok] of Object.entries(data?.userProbe ?? {})) {
        userProbeMap.set(tbl, !!ok);
      }

      console.log('[Scanner] Probing routes...');
      const routeReach = await probeRoutes(inputs.routes);
      console.log('[Scanner] Route probe results:', routeReach);

      // Use dynamic imports to really test component loading
      const canImportComponent = async (path: string): Promise<boolean> => {
        try {
          await import(/* @vite-ignore */ `/${path}`);
          return true;
        } catch {
          return false;
        }
      };

      const checkComponentsDeep = async (f: any): Promise<boolean> => {
        if (!Array.isArray(f.components) || f.components.length === 0) return false;
        const results = await Promise.all(
          f.components.map((path: string) => canImportComponent(path))
        );
        return results.every(Boolean);
      };

      const scanned = new Map<string, ScannedFeature>();
      
      // Process each feature and its sub-features recursively
      const processFeature = async (f: any, parentId?: string) => {
        const featureId = parentId ? `${parentId}.${f.id}` : f.id;
        const hasRoute = (f.routes || []).some((r: string) => routeReach[r]);
        const componentsExist = await checkComponentsDeep(f);
        
        const rpcs = (f.rpc || []).map((name: string) => {
          const rpcInfo = rpcMap.get(name) ?? { exists: false };
          return { 
            name, 
            exists: rpcInfo.exists,
            security_definer: rpcInfo.security_definer
          };
        });
        const rpcAll = rpcs.length ? rpcs.every(x => x.exists) : true;
        
        const tables = (f.tables || []).map((name: string) => {
          const t = tableMap.get(name) ?? { exists: false, rls: false };
          return { name, ...t };
        });

        const rlsProbes = (f.rls_read_tables || []).map((name: string) => ({
          table: name,
          userCanRead: userProbeMap.get(name) ?? false
        }));

        const computed = computeStatus(hasRoute, componentsExist, rpcAll);
        
        scanned.set(featureId, {
          ...f,
          computed,
          checks: {
            routeReachable: hasRoute,
            componentsExist,
            rpcs,
            tables,
            rlsProbes
          }
        } as ScannedFeature);

        // Recurse into sub-features
        if (f.subFeatures) {
          for (const sub of f.subFeatures) {
            await processFeature(sub, featureId);
          }
        }
      };

      for (const f of manifest.features as any[]) {
        await processFeature(f);
      }

      console.log('[Scanner] Scan complete. Features scanned:', scanned.size);
      setScannedFeatures(scanned);
      toast.success(`Feature scan complete: ${scanned.size} features analyzed`, {
        description: `Found ${undocumentedRoutes.length} undocumented routes, ${undocumentedRpcs.length} RPCs, ${undocumentedTables.length} tables`
      });
    } catch (e: any) {
      console.error('[Scanner] Scan error:', e);
      toast.error(e.message || 'Failed to scan features');
    } finally {
      setScanLoading(false);
    }
  }, [probeRoutes, computeStatus]);

  // Summary stats
  const totalFeatures = features.length;
  const byStatus = stats.byStatus;
  const byArea = stats.byArea as Record<string, { shell: number; 'full-ui': number; wired: number }>;
  const percentComplete = stats.completionPercent;
  const shellInProd = isProd ? features.filter(f => f.status === 'shell' && f.routes.length > 0).length : 0;

  // Get all unique canonical areas for filter
  const allAreas = useMemo(() => 
    Array.from(new Set(features.map(f => AREA_ALIASES[f.area] ?? f.area))).sort(),
    [features]
  );

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Index</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalFeatures} features · {percentComplete.toFixed(1)}% complete
          </p>
          <p className="text-xs text-muted-foreground">
            Sources: {stats.sources.base} base · {stats.sources.overlays} overlay · {stats.sources.generated} generated
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runFeatureScan} disabled={scanLoading} variant="default">
            <Scan className={`h-4 w-4 mr-2 ${scanLoading ? 'animate-spin' : ''}`} />
            {scanLoading ? 'Scanning...' : 'Scan Features'}
          </Button>
          {scannedFeatures.size > 0 && (
            <>
              <Button onClick={handleExportScanResults} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export {selectedForExport.size > 0 ? `${selectedForExport.size} Selected` : 'All'}
              </Button>
              {selectedForExport.size > 0 && (
                <Button onClick={handleSelectNone} variant="ghost" size="sm">
                  Clear Selection
                </Button>
              )}
            </>
          )}
          <Button onClick={handleExportJSON} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/audit">
              <Shield className="h-4 w-4 mr-2" />
              Run Audit
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {!goldPath.ready && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-medium text-red-900">Gold-Path Not Ready</div>
              <div className="text-sm text-red-700 mt-1">
                {goldPath.blocking.length} critical features are still in shell status:
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {goldPath.blocking.map(id => (
                  <Badge key={id} variant="destructive" className="text-xs">
                    {id}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {shellInProd > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-900">Production Warning</div>
              <div className="text-sm text-yellow-700 mt-1">
                {shellInProd} shell features have routes exposed in production and should be protected
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="text-sm px-3 py-1.5">
          <span className="font-semibold">{counts.shell}</span>
          <span className="ml-1.5 text-muted-foreground">Shell</span>
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-100">
          <span className="font-semibold">{counts.fullUi}</span>
          <span className="ml-1.5">Full UI</span>
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-100">
          <span className="font-semibold">{counts.wired}</span>
          <span className="ml-1.5">Wired</span>
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-100">
          <span className="font-semibold">{counts.goldPathCount}</span>
          <span className="ml-1.5">Gold Path</span>
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-100">
          <span className="font-semibold">{counts.blockingCount}</span>
          <span className="ml-1.5">Blocking (P0)</span>
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Search features..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {allAreas.map(a => (
              <SelectItem key={a} value={a}>{labelForArea(a)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="shell">Shell</SelectItem>
            <SelectItem value="full-ui">Full UI</SelectItem>
            <SelectItem value="wired">Wired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="p0">P0</SelectItem>
            <SelectItem value="p1">P1</SelectItem>
            <SelectItem value="p2">P2</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="platform">Platform</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'status' | 'area')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="area">Sort by Area</SelectItem>
            <SelectItem value="status">Sort by Status</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showPlaceholders ? 'default' : 'outline'}
          onClick={() => setShowPlaceholders(!showPlaceholders)}
          size="sm"
        >
          {showPlaceholders ? 'Showing Placeholders' : 'Show Placeholders'}
        </Button>
      </div>

      {/* Test Results Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>GitHub Test Results</CardTitle>
              <CardDescription>
                View test results from GitHub Actions
                {repoInfo.owner && repoInfo.repo && ` · ${repoInfo.owner}/${repoInfo.repo}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchTestResults} disabled={testLoading} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${testLoading ? 'animate-spin' : ''}`} />
                {testLoading ? 'Loading...' : 'Load Tests'}
              </Button>
              {runs.length > 0 && (
                <Button onClick={() => setShowTests(!showTests)} variant="ghost" size="sm">
                  {showTests ? 'Hide' : 'Show'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {showTests && latestRun && (
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(latestRun.status, latestRun.conclusion)}
                  <div>
                    <div className="font-semibold">{latestRun.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Run #{latestRun.run_number} · {new Date(latestRun.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(latestRun.status, latestRun.conclusion)}
                  <Button variant="ghost" size="sm" asChild>
                    <a href={latestRun.html_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
              {latestJobs.length > 0 && (
                <div className="space-y-3 ml-8">
                  {latestJobs.map((job) => (
                    <div key={job.id} className="border-l-2 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status, job.conclusion)}
                          <span className="font-medium text-sm">{job.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(job.status, job.conclusion)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Undocumented Items */}
      {scannedFeatures.size > 0 && (window as any).__undocumented && (
        <Card>
          <CardHeader>
            <CardTitle>Undocumented Items</CardTitle>
            <CardDescription>Routes, RPCs, and tables discovered but not in features.json</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Undocumented Routes */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline">{((window as any).__undocumented.routes || []).length}</Badge>
                Undocumented Routes
              </h3>
              <div className="flex flex-wrap gap-2">
                {((window as any).__undocumented.routes || []).slice(0, 20).map((route: string) => (
                  <Badge key={route} variant="secondary" className="text-xs">
                    {route}
                  </Badge>
                ))}
                {((window as any).__undocumented.routes || []).length > 20 && (
                  <Badge variant="outline" className="text-xs">
                    +{((window as any).__undocumented.routes || []).length - 20} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Undocumented RPCs */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline">{((window as any).__undocumented.rpcs || []).length}</Badge>
                Undocumented RPCs
              </h3>
              <div className="flex flex-wrap gap-2">
                {((window as any).__undocumented.rpcs || []).slice(0, 20).map((rpc: string) => (
                  <Badge key={rpc} variant="secondary" className="text-xs font-mono">
                    {rpc}
                  </Badge>
                ))}
                {((window as any).__undocumented.rpcs || []).length > 20 && (
                  <Badge variant="outline" className="text-xs">
                    +{((window as any).__undocumented.rpcs || []).length - 20} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Undocumented Tables */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline">{((window as any).__undocumented.tables || []).length}</Badge>
                Undocumented Tables
              </h3>
              <div className="flex flex-wrap gap-2">
                {((window as any).__undocumented.tables || []).slice(0, 20).map((table: string) => (
                  <Badge key={table} variant="secondary" className="text-xs font-mono">
                    {table}
                  </Badge>
                ))}
                {((window as any).__undocumented.tables || []).length > 20 && (
                  <Badge variant="outline" className="text-xs">
                    +{((window as any).__undocumented.tables || []).length - 20} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner Results */}
      {scannedFeatures.size > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Feature Status</CardTitle>
                <CardDescription>Real-time scan results vs. manifest claims</CardDescription>
              </div>
              <Button onClick={() => setShowScanner(!showScanner)} variant="ghost" size="sm">
                {showScanner ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          {showScanner && (
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Button onClick={handleSelectAll} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={handleSelectNone} variant="outline" size="sm">
                  Select None
                </Button>
                {selectedForExport.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedForExport.size} selected
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center p-2 w-12">
                        <input
                          type="checkbox"
                          checked={selectedForExport.size === scannedFeatures.size && scannedFeatures.size > 0}
                          onChange={(e) => e.target.checked ? handleSelectAll() : handleSelectNone()}
                          className="cursor-pointer"
                        />
                      </th>
                      <th className="text-left p-2">Feature</th>
                      <th className="text-center p-2">Area</th>
                      <th className="text-center p-2">Manifest</th>
                      <th className="text-center p-2">Computed</th>
                      <th className="text-center p-2">Route</th>
                      <th className="text-center p-2">Components</th>
                      <th className="text-left p-2">RPCs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((feature) => {
                      const scan = scannedFeatures.get(feature.id);
                      return (
                        <tr key={feature.id} className="border-b hover:bg-accent">
                          <td className="text-center p-2">
                            <input
                              type="checkbox"
                              checked={selectedForExport.has(feature.id)}
                              onChange={() => handleToggleFeature(feature.id)}
                              className="cursor-pointer"
                            />
                          </td>
                          <td className="p-2">{feature.title}</td>
                          <td className="text-center p-2">{feature.area}</td>
                          <td className="text-center p-2">
                            <StatusBadge status={feature.status} />
                          </td>
                          <td className="text-center p-2">
                            {scan?.computed ? (
                              <StatusBadge status={scan.computed} />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="text-center p-2">
                            {scan?.checks?.routeReachable ? '🟢' : '🔴'}
                          </td>
                          <td className="text-center p-2">
                            {scan?.checks?.componentsExist ? '🟢' : '🔴'}
                          </td>
                          <td className="p-2">
                            {scan?.checks?.rpcs?.length ? (
                              <div className="space-y-1">
                                {scan.checks.rpcs.map(rpc => (
                                  <div key={rpc.name} className="text-xs flex items-center gap-1">
                                    <span>{rpc.exists ? '🟢' : '🔴'}</span>
                                    <span>{rpc.name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Features Grid */}
      <div className="space-y-3">
        {sorted.map((feature) => {
          const scan = scannedFeatures.get(feature.id);
          const displayFeature = scan || feature;
          return (
            <FeatureCard
              key={feature.id}
              feature={displayFeature}
              isGoldPath={GOLD_PATH_FEATURES.includes(feature.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddSubFeature={handleAddSubFeature}
            />
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No features match your filters
        </div>
      )}

      {/* Feature Editor Dialog */}
      <FeatureEditorDialog
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingFeature(null);
          setAddingSubFeatureTo(null);
        }}
        onSave={handleSaveFeature}
        feature={editingFeature}
        parentId={addingSubFeatureTo || undefined}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: FeatureStatus }) {
  const colors = {
    wired: 'bg-green-500 text-white',
    'full-ui': 'bg-amber-500 text-white',
    shell: 'bg-gray-400 text-white'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
}
