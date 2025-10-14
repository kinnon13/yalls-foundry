/**
 * Control Room (Day-0 Debug Dashboard)
 * 
 * Self-contained testing interface for verifying app functionality
 * without external dependencies or API keys.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { checkHealth } from '@/api/health';
import { listFlags, setFlag } from '@/lib/featureFlags';
import { seedProfiles, seedEvents, clearAll, counts } from '@/lib/mock/store';
import { runSyntheticChecks, SyntheticResult } from '@/lib/synthetics/checks';
import { downloadJSON, downloadCSV, copy } from '@/lib/export/download';
import { syntheticResultsToRows } from '@/lib/synthetics/serialize';
import { takeCodeSnapshot } from '@/lib/export/codeSnapshot';
import { parseSpec, comparePaths } from '@/lib/export/specCompare';
import { exportArchitecture, routesToMermaid } from '@/lib/export/architecture';
import AuthPanel from '@/routes/admin/panels/AuthPanel';
import FeedbackInbox from '@/routes/admin/panels/FeedbackInbox';
import CodeSearchPanel from '@/routes/admin/panels/CodeSearchPanel';
import { Activity, List, Flag, Database, Zap, Info, Download, Code, FileCheck, Map } from 'lucide-react';

export default function ControlRoom() {
  const [healthStatus, setHealthStatus] = useState<{ ok: boolean; source: string; ts: string } | null>(null);
  const [mockCounts, setMockCounts] = useState(counts());
  const [flags, setFlags] = useState(listFlags());
  const [syntheticResults, setSyntheticResults] = useState<SyntheticResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [specText, setSpecText] = useState('');
  const [specResult, setSpecResult] = useState<{ missing: string[]; extra: string[] } | null>(null);
  const [actualPaths, setActualPaths] = useState<string[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(true);
  const [archMermaid, setArchMermaid] = useState('');

  const routes = [
    { path: '/', name: 'Home' },
    { path: '/search', name: 'Search' },
    { path: '/admin/control-room', name: 'Control Room' },
  ];

  const handleHealthCheck = async () => {
    setLoading('health');
    const result = await checkHealth();
    setHealthStatus(result);
    setLoading(null);
  };

  const handleSeedProfiles = () => {
    seedProfiles(10);
    setMockCounts(counts());
  };

  const handleSeedEvents = () => {
    seedEvents(5);
    setMockCounts(counts());
  };

  const handleClearMock = () => {
    clearAll();
    setMockCounts(counts());
  };

  const handleToggleFlag = (key: string, value: boolean) => {
    setFlag(key, value);
    setFlags(listFlags());
  };

  const handleRunSynthetics = async () => {
    setLoading('synthetics');
    const results = await runSyntheticChecks();
    setSyntheticResults(results);
    setLoading(null);
  };

  // Load actual project files once on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingPaths(true);
      try {
        const snap = await takeCodeSnapshot({
          routes: true,
          components: true,
          lib: true,
          sql: true,
          maxBytesPerFile: 1, // only need paths, minimal load
        });
        if (!alive) return;
        setActualPaths(snap.files.map(f => f.path));
      } catch (error) {
        console.error('Failed to load project paths:', error);
      } finally {
        if (alive) setLoadingPaths(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const buildInfo = {
    nodeEnv: import.meta.env.MODE || 'development',
    appName: import.meta.env.VITE_APP_NAME || 'yalls.ai',
    siteUrl: import.meta.env.VITE_SITE_URL || 'http://localhost:5173',
    timestamp: new Date().toISOString(),
  };

  // Export/Share handlers
  const buildReport = () => ({
    meta: {
      generated_at: new Date().toISOString(),
      app: buildInfo.appName,
      url: buildInfo.siteUrl,
      mode: buildInfo.nodeEnv,
      version: import.meta.env.VITE_GIT_SHA ?? 'dev',
    },
    health: healthStatus ?? { ok: null, source: null, ts: null },
    featureFlags: flags,
    mockCounts,
    routes,
    synthetics: syntheticResults,
  });

  const handleExportJSON = () => {
    const report = buildReport();
    downloadJSON(`control-room-report-${Date.now()}.json`, report);
  };

  const handleExportCSV = () => {
    const rows: Record<string, any>[] = [
      // health row
      {
        kind: 'health',
        name: 'health_endpoint',
        ok: healthStatus?.ok ?? null,
        duration_ms: null,
        message: healthStatus ? `source=${healthStatus.source}` : 'not-run',
      },
      // synthetic rows
      ...syntheticResultsToRows(syntheticResults, 'synthetic'),
    ];
    downloadCSV(`control-room-report-${Date.now()}.csv`, rows);
  };

  const handleCopyJSON = async () => {
    try {
      const report = buildReport();
      await copy(JSON.stringify(report, null, 2));
      alert('✓ Report JSON copied to clipboard');
      console.info('Report JSON copied to clipboard');
    } catch (error) {
      alert(`✗ Failed to copy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Code snapshot handlers
  const handleCodeSnapshot = async () => {
    setLoading('snapshot');
    try {
      const snapshot = await takeCodeSnapshot({
        routes: true,
        components: true,
        lib: true,
        sql: true,
      });
      downloadJSON(`code-snapshot-${Date.now()}.json`, snapshot);
    } catch (error) {
      console.error('Snapshot failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleCopyCodeSnapshot = async () => {
    setLoading('snapshot-copy');
    try {
      const snapshot = await takeCodeSnapshot({
        routes: true,
        components: true,
        lib: true,
        sql: true,
      });
      const json = JSON.stringify(snapshot, null, 2);
      const sizeMB = (new Blob([json]).size / 1024 / 1024).toFixed(2);
      
      await copy(json);
      alert(`✓ Snapshot copied to clipboard (${sizeMB} MB)\n\nFiles: ${snapshot.files.length}\nTotal size: ${(snapshot.totals.bytes / 1024).toFixed(0)} KB`);
      console.info('Code snapshot copied to clipboard');
    } catch (error) {
      console.error('Snapshot copy failed:', error);
      alert(`✗ Failed to copy snapshot to clipboard\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTry using "Export Snapshot JSON" button instead.`);
    } finally {
      setLoading(null);
    }
  };

  // Copy only the file list (smaller, safe to paste in chat tools)
  const handleCopySnapshotFileList = async () => {
    setLoading('snapshot-files');
    try {
      const snapshot = await takeCodeSnapshot({
        routes: true,
        components: true,
        lib: true,
        sql: true,
      });
      const text = snapshot.files.map(f => f.path).join('\n');
      await copy(text);
      
      // Show copyable textarea as fallback
      const pre = document.createElement('pre');
      pre.textContent = text;
      pre.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:white;border:2px solid black;padding:20px;max-height:80vh;overflow:auto;';
      document.body.appendChild(pre);
      
      const btn = document.createElement('button');
      btn.textContent = 'Close';
      btn.style.cssText = 'position:absolute;top:10px;right:10px;';
      btn.onclick = () => document.body.removeChild(pre);
      pre.appendChild(btn);
      
      alert(`✓ File list ready!\nCount: ${snapshot.files.length}\n\nIf Ctrl+V doesn't work, select & copy from the popup window that just appeared.`);
    } catch (error) {
      console.error('Snapshot file list copy failed:', error);
      alert('✗ Failed to copy file list.');
    } finally {
      setLoading(null);
    }
  };

  // Spec compare handler
  const handleCompareSpec = () => {
    setLoading('spec-compare');
    try {
      const expectedPaths = parseSpec(specText);
      const result = comparePaths(expectedPaths, actualPaths);
      setSpecResult(result);
    } catch (error) {
      console.error('Spec compare failed:', error);
    } finally {
      setLoading(null);
    }
  };

  // Architecture export handlers
  const handleArchExport = async () => {
    setLoading('arch-export');
    try {
      const arch = await exportArchitecture();
      downloadJSON(`architecture-${Date.now()}.json`, arch);
    } catch (error) {
      console.error('Architecture export failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleArchMermaid = async () => {
    setLoading('arch-mermaid');
    try {
      const arch = await exportArchitecture();
      const mermaid = routesToMermaid(arch.routes);
      setArchMermaid(mermaid);
      
      // Try to copy
      try {
        await copy(mermaid);
        alert(`✓ Mermaid diagram copied!\n\nRoutes: ${arch.routes.length}\nPaste into mermaid.live or any Mermaid viewer`);
      } catch (copyErr) {
        // Fallback: show in popup for manual copy
        const pre = document.createElement('pre');
        pre.textContent = mermaid;
        pre.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:white;border:2px solid black;padding:20px;max-height:80vh;overflow:auto;width:80%;max-width:600px;font-family:monospace;font-size:12px;';
        document.body.appendChild(pre);
        
        const btn = document.createElement('button');
        btn.textContent = '✕ Close';
        btn.style.cssText = 'position:absolute;top:10px;right:10px;padding:5px 10px;border:1px solid black;background:white;cursor:pointer;';
        btn.onclick = () => document.body.removeChild(pre);
        pre.appendChild(btn);
        
        alert(`Clipboard blocked. Select & copy from the popup window.\n\nRoutes: ${arch.routes.length}`);
      }
      
      console.info('Mermaid diagram generated');
    } catch (error) {
      console.error('Mermaid generation failed:', error);
      alert(`✗ Failed to generate Mermaid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <SEOHelmet title="Control Room" description="Day-0 debug dashboard" />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Control Room</h1>
              <p className="text-muted-foreground">Day-0 Debug Dashboard (Dev Only)</p>
            </div>
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 1. Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health
                </CardTitle>
                <CardDescription>System health check</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleHealthCheck}
                  disabled={loading === 'health'}
                  className="w-full"
                >
                  {loading === 'health' ? 'Checking...' : 'Run Health Check'}
                </Button>
                {healthStatus && (
                  <div className="space-y-2">
                    <Badge variant={healthStatus.ok ? 'default' : 'destructive'} className="w-full justify-center">
                      {healthStatus.ok ? '✓ OK' : '✗ FAIL'} ({healthStatus.source})
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(healthStatus.ts).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Routes Inventory */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Routes
                </CardTitle>
                <CardDescription>Available SPA routes</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {routes.map((route) => (
                    <li key={route.path}>
                      <Link 
                        to={route.path}
                        className="text-sm text-primary hover:underline"
                      >
                        {route.path} - {route.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 3. Feature Flags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>Local toggles (persisted)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(flags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={`flag-${key}`} className="text-sm capitalize">
                      {key}
                    </Label>
                    <Switch
                      id={`flag-${key}`}
                      checked={value}
                      onCheckedChange={(checked) => handleToggleFlag(key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 4. Mock Data Sandbox */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Mock Data
                </CardTitle>
                <CardDescription>In-memory test data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={handleSeedProfiles} variant="outline" size="sm" className="flex-1">
                    +10 Profiles
                  </Button>
                  <Button onClick={handleSeedEvents} variant="outline" size="sm" className="flex-1">
                    +5 Events
                  </Button>
                </div>
                <Button onClick={handleClearMock} variant="destructive" size="sm" className="w-full">
                  Clear All
                </Button>
                <div className="pt-2 border-t space-y-1">
                  <p className="text-sm">Profiles: <strong>{mockCounts.profiles}</strong></p>
                  <p className="text-sm">Events: <strong>{mockCounts.events}</strong></p>
                </div>
              </CardContent>
            </Card>

            {/* 5. Synthetics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Synthetics
                </CardTitle>
                <CardDescription>Automated checks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleRunSynthetics}
                  disabled={loading === 'synthetics'}
                  className="w-full"
                >
                  {loading === 'synthetics' ? 'Running...' : 'Run Synthetic Checks'}
                </Button>
                {syntheticResults.length > 0 && (
                  <div className="space-y-2">
                    {syntheticResults.map((result) => (
                      <div key={result.name} className="flex items-center justify-between text-sm">
                        <span className="truncate">{result.name}</span>
                        <Badge variant={result.ok ? 'default' : 'destructive'} className="ml-2">
                          {result.ok ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 6. Build Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Build Info
                </CardTitle>
                <CardDescription>Environment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Mode:</span>{' '}
                  <strong>{buildInfo.nodeEnv}</strong>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">App:</span>{' '}
                  <strong>{buildInfo.appName}</strong>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">URL:</span>{' '}
                  <strong className="break-all">{buildInfo.siteUrl}</strong>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Timestamp:</span>{' '}
                  <strong className="text-xs">{new Date(buildInfo.timestamp).toLocaleString()}</strong>
                </div>
              </CardContent>
            </Card>

            {/* 7. Export / Share */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export / Share
                </CardTitle>
                <CardDescription>Download or copy report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={handleExportJSON} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Export JSON
                </Button>
                <Button 
                  onClick={handleExportCSV} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Export CSV
                </Button>
                <Button 
                  onClick={handleCopyJSON} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Copy JSON to Clipboard
                </Button>
                
                {/* Quick clipboard test */}
                <div className="pt-2 border-t">
                  <Button 
                    onClick={async () => {
                      const testMsg = `✓ Clipboard working!\nTime: ${new Date().toLocaleTimeString()}\nCard: Export/Share`;
                      await copy(testMsg);
                      alert('Test message copied! Paste it anywhere to verify.');
                    }}
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                  >
                    🧪 Test Clipboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 8. Code & Layout Snapshot */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code & Layout
                </CardTitle>
                <CardDescription>Export file tree + code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={handleCodeSnapshot}
                  disabled={loading === 'snapshot'}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  {loading === 'snapshot' ? 'Exporting...' : 'Export Snapshot JSON'}
                </Button>
                <Button 
                  onClick={handleCopyCodeSnapshot}
                  disabled={loading === 'snapshot-copy'}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  {loading === 'snapshot-copy' ? 'Copying...' : 'Copy Snapshot to Clipboard'}
                </Button>
                <Button 
                  onClick={handleCopySnapshotFileList}
                  disabled={loading === 'snapshot-files'}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  {loading === 'snapshot-files' ? 'Copying...' : 'Copy File List (paths)'}
                </Button>
                
                {/* Quick clipboard test */}
                <div className="pt-2 border-t">
                  <Button 
                    onClick={async () => {
                      const testMsg = `✓ Clipboard working!\nTime: ${new Date().toLocaleTimeString()}\nProject: yalls.ai Day-1`;
                      await copy(testMsg);
                      alert('Test message copied! Paste it anywhere (Grok, notepad, etc.) to verify.');
                    }}
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                  >
                    🧪 Test Clipboard (paste anywhere)
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground pt-2">
                  Includes routes, components, lib files, and SQL migrations
                </p>
              </CardContent>
            </Card>

            {/* 9. Spec Compare */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Spec Compare
                  {!loadingPaths && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {actualPaths.length} files detected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Compare against expected layout</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Paste expected file paths (one per line)..."
                  value={specText}
                  onChange={(e) => setSpecText(e.target.value)}
                  rows={4}
                  className="text-xs font-mono"
                />
                <Button 
                  onClick={handleCompareSpec}
                  disabled={loading === 'spec-compare' || !specText.trim() || loadingPaths}
                  size="sm"
                  className="w-full"
                >
                  {loadingPaths ? 'Loading paths...' : loading === 'spec-compare' ? 'Comparing...' : 'Compare Paths'}
                </Button>
                {specResult && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="text-xs">
                      <strong className="text-red-600">Missing ({specResult.missing.length}):</strong>
                      {specResult.missing.length === 0 ? ' None' : (
                        <div className="text-red-600 pl-2 max-h-20 overflow-auto font-mono">
                          {specResult.missing.map(p => <div key={p}>{p}</div>)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs">
                      <strong className="text-yellow-600">Extra ({specResult.extra.length}):</strong>
                      {specResult.extra.length === 0 ? ' None' : (
                        <div className="text-yellow-600 pl-2 max-h-20 overflow-auto font-mono">
                          {specResult.extra.map(p => <div key={p}>{p}</div>)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 10. Auth Session */}
            <AuthPanel />

            {/* 11. Architecture Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Architecture
                </CardTitle>
                <CardDescription>Routes, flow, and file organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={handleArchExport}
                  disabled={loading === 'arch-export'}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  {loading === 'arch-export' ? 'Exporting...' : 'Export Full Architecture JSON'}
                </Button>
                <Button 
                  onClick={handleArchMermaid}
                  disabled={loading === 'arch-mermaid'}
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  {loading === 'arch-mermaid' ? 'Generating...' : 'Copy Route Map (Mermaid)'}
                </Button>
                {archMermaid && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-green-600 mb-2">✓ Copied to clipboard! Paste in Mermaid viewer</p>
                    <Textarea
                      value={archMermaid}
                      readOnly
                      rows={8}
                      className="text-xs font-mono"
                    />
                  </div>
                )}
                
                {/* Quick clipboard test */}
                <div className="pt-2 border-t">
                  <Button 
                    onClick={async () => {
                      const testMsg = `✓ Clipboard working!\nTime: ${new Date().toLocaleTimeString()}\nCard: Architecture`;
                      await copy(testMsg);
                      alert('Test message copied! Paste it anywhere to verify.');
                    }}
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                  >
                    🧪 Test Clipboard
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground pt-2">
                  JSON includes: routes (+ guards), file tree, and layer organization
                </p>
              </CardContent>
            </Card>

            {/* 12. Feedback Inbox */}
            <FeedbackInbox />

            {/* 13. Code Search & Export */}
            <CodeSearchPanel />
          </div>
        </div>
      </div>
    </>
  );
}
