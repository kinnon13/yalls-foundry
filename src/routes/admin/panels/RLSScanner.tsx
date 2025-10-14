/**
 * RLS Scanner Panel
 * 
 * Scans database for RLS policies, missing policies, and security issues.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { downloadJSON, downloadCSV } from '@/lib/export/download';
import { Shield, AlertTriangle, CheckCircle, Download } from 'lucide-react';

type RLSStatus = {
  table_name: string;
  table_schema: string;
  rls_enabled: boolean;
  policies: any[];
  risk_level: 'safe' | 'warning' | 'critical';
};

export default function RLSScanner() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<RLSStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scanRLS = async () => {
    setScanning(true);
    setError(null);
    setResults([]); // Clear previous results

    try {
      // Call RPC function to get RLS status
      const { data: tables, error: tablesError } = await supabase.rpc('get_tables_rls_status');

      if (tablesError) {
        console.error('RLS scan RPC error:', tablesError);
        throw new Error(`RLS scan failed: ${tablesError.message || JSON.stringify(tablesError)}`);
      }

      if (!tables || tables.length === 0) {
        throw new Error('No tables found in public schema');
      }

      setResults(tables as RLSStatus[]);
    } catch (err) {
      console.error('RLS scan failed:', err);
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`Scan error: ${errorMsg}`);
    } finally {
      setScanning(false);
    }
  };

  const handleExportJSON = () => {
    const report = {
      generated_at: new Date().toISOString(),
      total_tables: results.length,
      rls_enabled: results.filter((r) => r.rls_enabled).length,
      critical: results.filter((r) => r.risk_level === 'critical').length,
      warnings: results.filter((r) => r.risk_level === 'warning').length,
      tables: results,
    };
    downloadJSON(`rls-scan-${Date.now()}.json`, report);
  };

  const handleExportCSV = () => {
    const rows = results.map((r) => ({
      schema: r.table_schema,
      table: r.table_name,
      rls_enabled: r.rls_enabled,
      policies_count: r.policies.length,
      risk_level: r.risk_level,
    }));
    downloadCSV(`rls-scan-${Date.now()}.csv`, rows);
  };

  const criticalCount = results.filter((r) => r.risk_level === 'critical').length;
  const warningCount = results.filter((r) => r.risk_level === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          RLS Security Scanner
        </CardTitle>
        <CardDescription>
          Scan database tables for Row Level Security policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={scanRLS} disabled={scanning} className="flex-1">
            {scanning ? 'Scanning...' : 'Scan RLS Policies'}
          </Button>
          {results.length > 0 && (
            <>
              <Button onClick={handleExportJSON} variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              <Button onClick={handleExportCSV} variant="outline" size="icon">
                CSV
              </Button>
            </>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">RLS Scan Failed</div>
              <div className="text-xs mt-1">{error}</div>
              <div className="text-xs mt-2 opacity-75">
                Check console logs for details or contact support
              </div>
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold">{results.length}</div>
                <div className="text-xs text-muted-foreground">Total Tables</div>
              </div>
              {criticalCount > 0 && (
                <div className="text-center p-3 border rounded border-destructive">
                  <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
                  <div className="text-xs text-muted-foreground">Critical</div>
                </div>
              )}
              {warningCount > 0 && (
                <div className="text-center p-3 border rounded border-yellow-500">
                  <div className="text-2xl font-bold text-yellow-500">{warningCount}</div>
                  <div className="text-xs text-muted-foreground">Warnings</div>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={`${result.table_schema}.${result.table_name}`}
                  className="p-3 border rounded space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-semibold">{result.table_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({result.table_schema})</span>
                    </div>
                    {result.rls_enabled ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        RLS ON
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        RLS OFF
                      </Badge>
                    )}
                  </div>
                  {result.policies.length > 0 ? (
                    <div className="text-xs space-y-1">
                      <div className="font-medium">{result.policies.length} policies:</div>
                      {result.policies.map((p: any, i: number) => (
                        <div key={i} className="pl-2 text-muted-foreground">
                          • {p.name} ({p.command})
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No policies configured</div>
                  )}
                  {!result.rls_enabled && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        ⚠️ Table is publicly accessible - enable RLS immediately
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
