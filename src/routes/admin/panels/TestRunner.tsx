/**
 * Test Runner Panel
 * 
 * Runs all vitest tests and displays results with export capability.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { downloadJSON, downloadCSV } from '@/lib/export/download';
import { PlayCircle, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type TestResult = {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
};

type TestSuite = {
  name: string;
  tests: TestResult[];
  duration: number;
};

export default function TestRunner() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestSuite[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  } | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  const runTests = async () => {
    setRunning(true);

    try {
      const { data, error } = await supabase.functions.invoke('run-tests');

      if (error) {
        console.error('Test run error:', error);
        const msg = (error as any)?.message || '';
        if (msg.includes('Spawning subprocesses is not allowed')) {
          setUnsupported(true);
          toast.warning('Tests not supported in this environment', {
            description: 'Edge runtime cannot spawn Vitest. Run `pnpm test` locally or in CI.'
          });
        } else if (msg.includes('FunctionsRelayError') || msg.includes('not found')) {
          toast.error('Test runner deploying', {
            description: 'The test runner function is being deployed. Please wait a moment and try again.'
          });
        } else {
          toast.error('Failed to run tests', {
            description: msg || 'Unknown error'
          });
        }
        setRunning(false);
        return;
      }

      if (data?.error) {
        if (data.error === 'not_supported') {
          toast.warning('Tests not supported in preview', {
            description: 'Run `pnpm test` locally or in CI. This UI will display results when a CI endpoint is connected.'
          });
        } else {
          toast.error('Test execution failed', {
            description: data.error
          });
        }
        setRunning(false);
        return;
      }

      setResults(data.suites || []);
      setSummary(data.summary || null);
      toast.success('Tests completed', {
        description: `${data.summary?.passed || 0} passed, ${data.summary?.failed || 0} failed`
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to run tests', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setRunning(false);
    }
  };

  const handleExportJSON = () => {
    const report = {
      generated_at: new Date().toISOString(),
      summary,
      suites: results,
    };
    downloadJSON(`test-results-${Date.now()}.json`, report);
  };

  const handleExportCSV = () => {
    const rows = results.flatMap((suite) =>
      suite.tests.map((test) => ({
        suite: suite.name,
        test: test.name,
        status: test.status,
        duration_ms: test.duration,
        error: test.error || '',
      }))
    );
    downloadCSV(`test-results-${Date.now()}.csv`, rows);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          Test Runner
        </CardTitle>
        <CardDescription>Run all unit and integration tests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runTests} disabled={running} className="flex-1">
            {running ? 'Running Tests...' : 'Run All Tests'}
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

        {summary && (
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-3 border rounded">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 border rounded border-green-500">
              <div className="text-2xl font-bold text-green-500">{summary.passed}</div>
              <div className="text-xs text-muted-foreground">Passed</div>
            </div>
            {summary.failed > 0 && (
              <div className="text-center p-3 border rounded border-destructive">
                <div className="text-2xl font-bold text-destructive">{summary.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            )}
            <div className="text-center p-3 border rounded">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="text-lg font-bold">{summary.duration}ms</span>
              </div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((suite) => (
              <div key={suite.name} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{suite.name}</span>
                  <Badge variant="outline">{suite.tests.length} tests</Badge>
                </div>
                <div className="space-y-1">
                  {suite.tests.map((test, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        {test.status === 'passed' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : test.status === 'failed' ? (
                          <XCircle className="h-3 w-3 text-destructive" />
                        ) : (
                          <span className="h-3 w-3" />
                        )}
                        <span>{test.name}</span>
                      </div>
                      <span className="text-muted-foreground">{test.duration}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !running && (
          <Alert>
            <AlertDescription>
              Click "Run All Tests" to execute the test suite and see results here.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
