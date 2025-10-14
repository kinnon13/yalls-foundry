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
  table: string;
  schema: string;
  rls_enabled: boolean;
  policies: Array<{
    name: string;
    command: string;
    permissive: boolean;
    roles: string[];
  }>;
  risk_level: 'safe' | 'warning' | 'critical';
};

export default function RLSScanner() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<RLSStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scanRLS = async () => {
    setScanning(true);
    setError(null);

    try {
      // Get all tables in public schema
      const { data: tables, error: tablesError } = await supabase.rpc('get_tables_rls_status' as any);

      if (tablesError) {
        // Fallback: query pg_tables directly
        const { data: fallbackTables, error: fallbackError } = await supabase
          .from('pg_tables' as any)
          .select('schemaname, tablename, rowsecurity')
          .eq('schemaname', 'public');

        if (fallbackError) throw fallbackError;

        const rlsResults: RLSStatus[] = (fallbackTables || []).map((t: any) => ({
          table: t.tablename,
          schema: t.schemaname,
          rls_enabled: t.rowsecurity,
          policies: [],
          risk_level: t.rowsecurity ? 'safe' : 'critical',
        }));

        setResults(rlsResults);
      } else {
        setResults(tables || []);
      }
    } catch (err) {
      console.error('RLS scan failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
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
      schema: r.schema,
      table: r.table,
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
            <AlertDescription>{error}</AlertDescription>
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
                  key={`${result.schema}.${result.table}`}
                  className="p-3 border rounded space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{result.table}</span>
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
                  {result.policies.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {result.policies.length} policies configured
                    </div>
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
