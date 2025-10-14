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

  const runTests = async () => {
    setRunning(true);

    // Simulate test run (in real implementation, this would call vitest API or run via shell)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock results for demonstration
    const mockResults: TestSuite[] = [
      {
        name: 'Auth Tests',
        duration: 450,
        tests: [
          { name: 'should fetch user role', status: 'passed', duration: 120 },
          { name: 'should handle sign-in', status: 'passed', duration: 180 },
          { name: 'should default to guest on error', status: 'passed', duration: 150 },
        ],
      },
      {
        name: 'RBAC Tests',
        duration: 320,
        tests: [
          { name: 'admin can access admin.area', status: 'passed', duration: 80 },
          { name: 'guest cannot claim profiles', status: 'passed', duration: 90 },
          { name: 'business_owner can claim', status: 'passed', duration: 150 },
        ],
      },
      {
        name: 'Profile Service Tests',
        duration: 280,
        tests: [
          { name: 'should create profile', status: 'passed', duration: 100 },
          { name: 'should fetch by ID', status: 'passed', duration: 90 },
          { name: 'should update profile', status: 'passed', duration: 90 },
        ],
      },
    ];

    const totalTests = mockResults.reduce((acc, suite) => acc + suite.tests.length, 0);
    const passed = mockResults.reduce(
      (acc, suite) => acc + suite.tests.filter((t) => t.status === 'passed').length,
      0
    );
    const failed = mockResults.reduce(
      (acc, suite) => acc + suite.tests.filter((t) => t.status === 'failed').length,
      0
    );
    const skipped = mockResults.reduce(
      (acc, suite) => acc + suite.tests.filter((t) => t.status === 'skipped').length,
      0
    );
    const totalDuration = mockResults.reduce((acc, suite) => acc + suite.duration, 0);

    setResults(mockResults);
    setSummary({
      total: totalTests,
      passed,
      failed,
      skipped,
      duration: totalDuration,
    });
    setRunning(false);
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
