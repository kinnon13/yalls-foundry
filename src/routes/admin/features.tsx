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
import { isProductRpc, isProductRoute, isProductTable, collapseFamilies, collapsePartitions, normRoute, getRouteCategory } from '@/lib/feature-scan-filters';
import { classifyUndocRoutes } from '@/utils/route-coverage';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Shield, AlertCircle, Download, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, Scan, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [showUndocRoutes, setShowUndocRoutes] = useState(false);
  const [showUndocRpcs, setShowUndocRpcs] = useState(false);
  const [showUndocTables, setShowUndocTables] = useState(false);
  
  // Export selection state
  const [exportAreaDiscovery, setExportAreaDiscovery] = useState(true);
  const [exportRoutes, setExportRoutes] = useState(true);
  const [exportRpcs, setExportRpcs] = useState(true);
  const [exportTables, setExportTables] = useState(true);
  
  // Filter toggles
  const [filterProductOnly, setFilterProductOnly] = useState(true);
  const [collapseRouteFamilies, setCollapseRouteFamilies] = useState(true);
  const [collapseTablePartitions, setCollapseTablePartitions] = useState(true);

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

  const handleClaimFeature = (routeFamily: string) => {
    // Extract area from route (e.g., /marketplace/* -> marketplace)
    const area = routeFamily.replace(/^\//, '').replace(/\/.*$/, '').replace(/\*$/, '');
    const id = `${area}_main`;
    const title = area.charAt(0).toUpperCase() + area.slice(1).replace(/-/g, ' ');
    
    const featureStub = {
      id,
      title: `${title} (Claimed)`,
      area,
      status: "shell",
      routes: [routeFamily],
      components: [],
      rpc: [],
      tables: [],
      notes: `Auto-generated stub for ${routeFamily}. Add components, RPCs, and tables to complete.`
    };

    const blob = new Blob([JSON.stringify(featureStub, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feature-${area}-stub.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Feature stub created for ${routeFamily}`, {
      description: 'Copy this into features.json and fill in the details'
    });
  };

  const handleExportUndocumented = () => {
    const undoc = (window as any).__undocumented;
    if (!undoc) {
      toast.error('No undocumented items to export');
      return;
    }

    const data: any = { timestamp: new Date().toISOString() };
    let totalItems = 0;

    if (exportAreaDiscovery) {
      data.areaDiscovery = areasDebug;
      totalItems += areasDebug.raw.length + areasDebug.canonical.length + areasDebug.inferred.length;
    }

    if (exportRoutes || exportRpcs || exportTables) {
      data.undocumented = {};
      if (exportRoutes) {
        data.undocumented.routes = undoc.routes || [];
        totalItems += undoc.routes?.length || 0;
      }
      if (exportRpcs) {
        data.undocumented.rpcs = undoc.rpcs || [];
        totalItems += undoc.rpcs?.length || 0;
      }
      if (exportTables) {
        data.undocumented.tables = undoc.tables || [];
        totalItems += undoc.tables?.length || 0;
      }
    }

    if (totalItems === 0) {
      toast.error('Please select at least one section to export');
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `undocumented-items-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${totalItems} items to JSON`);
  };

  const handleExportUndocumentedCSV = () => {
    const undoc = (window as any).__undocumented;
    if (!undoc) {
      toast.error('No undocumented items to export');
      return;
    }

    // Create CSV content with BOM for Excel compatibility
    const BOM = '\uFEFF';
    let csv = BOM + 'Type,Name\n';
    let totalItems = 0;

    // Add area discovery
    if (exportAreaDiscovery) {
      areasDebug.raw.forEach((area: string) => {
        csv += `"Area (Raw)","${area.replace(/"/g, '""')}"\n`;
        totalItems++;
      });
      areasDebug.canonical.forEach((area: string) => {
        csv += `"Area (Canonical)","${area.replace(/"/g, '""')}"\n`;
        totalItems++;
      });
      areasDebug.inferred.forEach((area: string) => {
        csv += `"Area (Inferred)","${area.replace(/"/g, '""')}"\n`;
        totalItems++;
      });
    }

    // Add routes
    if (exportRoutes) {
      (undoc.routes || []).forEach((route: string) => {
        csv += `Route,"${route.replace(/"/g, '""')}"\n`;
        totalItems++;
      });
    }

    // Add RPCs
    if (exportRpcs) {
      (undoc.rpcs || []).forEach((rpc: string) => {
        csv += `RPC,"${rpc.replace(/"/g, '""')}"\n`;
        totalItems++;
      });
    }

    // Add tables
    if (exportTables) {
      (undoc.tables || []).forEach((table: string) => {
        csv += `Table,"${table.replace(/"/g, '""')}"\n`;
        totalItems++;
      });
    }

    if (totalItems === 0) {
      toast.error('Please select at least one section to export');
      return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `undocumented-items-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${totalItems} items to CSV`);
  };

  // Extract areas from features (both raw and canonical)
  const areasDebug = useMemo(() => {
    const rawAreas = new Set<string>();
    const canonicalAreas = new Set<string>();
    
    features.forEach(f => {
      rawAreas.add(f.area);
      canonicalAreas.add(AREA_ALIASES[f.area] ?? f.area);
    });

    // Also extract inferred areas from undocumented routes
    const inferredAreas = new Set<string>();
    const undoc = (window as any).__undocumented;
    if (undoc?.routes) {
      undoc.routes.forEach((route: string) => {
        const match = route.match(/^\/([^\/]+)/);
        if (match && match[1]) {
          inferredAreas.add(match[1]);
        }
      });
    }

    return {
      raw: Array.from(rawAreas).sort(),
      canonical: Array.from(canonicalAreas).sort(),
      inferred: Array.from(inferredAreas).sort(),
    };
  }, [features]);

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

      // Step 5: Compute undocumented items (with filtering)
      const rpcScan = (data?.rpcs ?? []).map((x: any) => x.name);
      const tableScan = (data?.tables ?? []).map((x: any) => x.name);
      
      // Apply product filter if enabled
      const productRoutes = filterProductOnly ? discoveredRoutes.filter(isProductRoute) : discoveredRoutes;
      const productRpcs = filterProductOnly ? rpcScan.filter(isProductRpc) : rpcScan;
      const productTables = filterProductOnly ? tableScan.filter(isProductTable) : tableScan;
      
      // Find undocumented items
      const rawUndocRoutes = productRoutes.filter(r => !documentedRoutes.has(r));
      const rawUndocRpcs = [...new Set(productRpcs.filter((n: string) => !documentedRpcs.has(n)))].sort();
      const rawUndocTables = productTables.filter((n: string) => !documentedTables.has(n));
      
      // Apply collapse based on toggles
      const undocumentedRoutes = collapseRouteFamilies ? collapseFamilies(rawUndocRoutes) : [...new Set(rawUndocRoutes)].sort();
      const undocumentedRpcs = rawUndocRpcs;
      const undocumentedTables = collapseTablePartitions ? collapsePartitions(rawUndocTables) : [...new Set(rawUndocTables)].sort();

      console.log('[Scanner] Undocumented items (filters applied):', {
        routes: undocumentedRoutes.length,
        rpcs: undocumentedRpcs.length,
        tables: undocumentedTables.length,
        filters: { productOnly: filterProductOnly, collapseRoutes: collapseRouteFamilies, collapsePartitions: collapseTablePartitions }
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
  }, [probeRoutes, computeStatus, filterProductOnly, collapseRouteFamilies, collapseTablePartitions]);

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

  // Classify undocumented routes by category
  const routeClassification = useMemo(() => {
    const undoc = (window as any).__undocumented;
    if (!undoc?.routes || undoc.routes.length === 0) {
      return { 
        alreadyClaimed: [], 
        partiallyClaimed: [], 
        trulyNew: [],
        byCategory: { public: [], private: [], workspace: [], other: [] }
      };
    }

    // Collect all documented routes from features (including deeply nested sub-features)
    const documentedRoutes: string[] = [];
    
    // Build a complete feature map by recursively walking the tree
    const featureMap = new Map<string, Feature>();
    const indexFeature = (f: Feature) => {
      featureMap.set(f.id, f);
      // If subFeatures exist as full objects (not just IDs), index them too
      if (f.subFeatures) {
        f.subFeatures.forEach((subId: string) => {
          // Try to find the sub-feature in the features array
          const subFeature = features.find(feat => feat.id === subId);
          if (subFeature && !featureMap.has(subId)) {
            indexFeature(subFeature);
          }
        });
      }
    };
    
    // Index all features
    features.forEach(indexFeature);
    
    // Walk the tree to collect all routes (handles subs of subs)
    const walkFeature = (f: Feature) => {
      documentedRoutes.push(...f.routes);
      if (f.subFeatures) {
        f.subFeatures.forEach((subId: string) => {
          const subFeature = featureMap.get(subId);
          if (subFeature) {
            walkFeature(subFeature);
          }
        });
      }
    };
    
    features.forEach((f: Feature) => walkFeature(f));

    const classification = classifyUndocRoutes(undoc.routes, documentedRoutes);
    
    // Categorize new routes
    const byCategory = {
      public: [] as string[],
      private: [] as string[],
      workspace: [] as string[],
      other: [] as string[],
    };
    
    classification.trulyNew.forEach((route: string) => {
      const category = getRouteCategory(route);
      if (category === 'public') byCategory.public.push(route);
      else if (category === 'private') byCategory.private.push(route);
      else if (category === 'workspace') byCategory.workspace.push(route);
      else byCategory.other.push(route);
    });
    
    console.log('[Route Classification]', {
      totalUndoc: undoc.routes.length,
      alreadyClaimed: classification.alreadyClaimed.length,
      partiallyClaimed: classification.partiallyClaimed.length,
      trulyNew: classification.trulyNew.length,
      totalDocumented: documentedRoutes.length,
      featureMapSize: featureMap.size,
      byCategory: {
        public: byCategory.public.length,
        private: byCategory.private.length,
        workspace: byCategory.workspace.length,
        other: byCategory.other.length,
      }
    });
    return { ...classification, byCategory };
  }, [(window as any).__undocumented?.routes, features]);

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
      {scannedFeatures.size > 0 && (window as any).__undocumented && (() => {
        const undoc = (window as any).__undocumented;
        const totalUndoc = (undoc.routes?.length || 0) + (undoc.rpcs?.length || 0) + (undoc.tables?.length || 0);
        
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Undocumented Items
                    <Badge variant="outline" className="text-lg">{totalUndoc}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Found in codebase/database but not in features.json
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleExportUndocumentedCSV} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={handleExportUndocumented} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-3 border-t mt-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={filterProductOnly}
                    onChange={(e) => setFilterProductOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>Product Only (filters PostGIS/extensions)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={collapseRouteFamilies}
                    onChange={(e) => setCollapseRouteFamilies(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>Collapse Route Families</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={collapseTablePartitions}
                    onChange={(e) => setCollapseTablePartitions(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>Collapse Partitions</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-4 pt-2 border-t mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={exportAreaDiscovery}
                    onChange={(e) => setExportAreaDiscovery(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>Area Discovery</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={exportRoutes}
                    onChange={(e) => setExportRoutes(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>Routes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={exportRpcs}
                    onChange={(e) => setExportRpcs(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>RPCs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={exportTables}
                    onChange={(e) => setExportTables(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>Tables</span>
                </label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Area Debug Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="text-sm font-semibold">Area Discovery</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="font-medium mb-2">Raw Areas in Features ({areasDebug.raw.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {areasDebug.raw.map(area => (
                        <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">After Aliasing ({areasDebug.canonical.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {areasDebug.canonical.map(area => (
                        <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Inferred from Routes ({areasDebug.inferred.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {areasDebug.inferred.slice(0, 15).map(area => (
                        <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                      ))}
                      {areasDebug.inferred.length > 15 && (
                        <Badge variant="outline" className="text-xs">
                          +{areasDebug.inferred.length - 15} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Aliases: dashboard → business, biz → business, shop → marketplace
                </div>
              </div>
              {/* Undocumented Routes */}
              <Collapsible open={showUndocRoutes} onOpenChange={setShowUndocRoutes}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between hover:bg-accent">
                    <div className="flex items-center gap-2">
                      {showUndocRoutes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">Undocumented Routes (Collapsed Families)</span>
                      <Badge variant="outline">{undoc.routes?.length || 0}</Badge>
                      {routeClassification.alreadyClaimed.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {routeClassification.alreadyClaimed.length} claimed
                        </Badge>
                      )}
                      {routeClassification.trulyNew.length > 0 && (
                        <Badge variant="default" className="text-xs">
                          {routeClassification.trulyNew.length} new
                        </Badge>
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="space-y-2 max-h-80 overflow-y-auto p-2 border rounded-lg">
                    {/* Already Claimed */}
                    {routeClassification.alreadyClaimed.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground px-2">Already Claimed</div>
                        {routeClassification.alreadyClaimed.map((route: string) => (
                          <div key={route} className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs opacity-50">
                                {route}
                              </Badge>
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              disabled
                              className="text-xs"
                            >
                              Claimed
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Partially Claimed */}
                    {routeClassification.partiallyClaimed.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <div className="text-xs font-semibold text-muted-foreground px-2">Partially Claimed</div>
                        {routeClassification.partiallyClaimed.map((route: string) => (
                          <div key={route} className="flex items-center justify-between gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {route}
                              </Badge>
                              <AlertCircle className="h-3 w-3 text-yellow-600" />
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Base route is already claimed. Claim family ${route}?`)) {
                                  handleClaimFeature(route);
                                }
                              }}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Claim Family
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Truly New - Categorized */}
                    {routeClassification.trulyNew.length > 0 && (
                      <div className="space-y-4 mt-4">
                        {/* Public Routes */}
                        {routeClassification.byCategory.public.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-2">
                              <div className="text-xs font-semibold text-muted-foreground">Public Routes</div>
                              <Badge variant="outline" className="text-xs">Browse & Share</Badge>
                            </div>
                            {routeClassification.byCategory.public.map((route: string) => (
                              <div key={route} className="flex items-center justify-between gap-2 p-2 hover:bg-accent/50 rounded">
                                <Badge variant="secondary" className="text-xs">
                                  {route}
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleClaimFeature(route)}
                                  className="text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Claim
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Private Routes */}
                        {routeClassification.byCategory.private.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-2">
                              <div className="text-xs font-semibold text-muted-foreground">Private Routes</div>
                              <Badge variant="outline" className="text-xs">User-Specific</Badge>
                            </div>
                            {routeClassification.byCategory.private.map((route: string) => (
                              <div key={route} className="flex items-center justify-between gap-2 p-2 hover:bg-accent/50 rounded">
                                <Badge variant="secondary" className="text-xs">
                                  {route}
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleClaimFeature(route)}
                                  className="text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Claim
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Workspace Routes */}
                        {routeClassification.byCategory.workspace.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 px-2">
                              <div className="text-xs font-semibold text-muted-foreground">Workspace Routes</div>
                              <Badge variant="outline" className="text-xs">Entity Hub</Badge>
                            </div>
                            {routeClassification.byCategory.workspace.map((route: string) => (
                              <div key={route} className="flex items-center justify-between gap-2 p-2 hover:bg-accent/50 rounded">
                                <Badge variant="secondary" className="text-xs">
                                  {route}
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleClaimFeature(route)}
                                  className="text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Claim
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Other Routes */}
                        {routeClassification.byCategory.other.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground px-2">Other Routes</div>
                            {routeClassification.byCategory.other.map((route: string) => (
                              <div key={route} className="flex items-center justify-between gap-2 p-2 hover:bg-accent/50 rounded">
                                <Badge variant="secondary" className="text-xs">
                                  {route}
                                </Badge>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleClaimFeature(route)}
                                  className="text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Claim
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Undocumented RPCs */}
              <Collapsible open={showUndocRpcs} onOpenChange={setShowUndocRpcs}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between hover:bg-accent">
                    <div className="flex items-center gap-2">
                      {showUndocRpcs ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">Undocumented RPCs</span>
                      <Badge variant="outline">{undoc.rpcs?.length || 0}</Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                    {(undoc.rpcs || []).map((rpc: string) => (
                      <Badge key={rpc} variant="secondary" className="text-xs font-mono">
                        {rpc}
                      </Badge>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Undocumented Tables */}
              <Collapsible open={showUndocTables} onOpenChange={setShowUndocTables}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between hover:bg-accent">
                    <div className="flex items-center gap-2">
                      {showUndocTables ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">Undocumented Tables</span>
                      <Badge variant="outline">{undoc.tables?.length || 0}</Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                    {(undoc.tables || []).map((table: string) => (
                      <Badge key={table} variant="secondary" className="text-xs font-mono">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        );
      })()}

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
