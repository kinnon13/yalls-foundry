/**
 * @feature(admin_tests)
 * Comprehensive Testing Dashboard
 * Run tests, view coverage, and export results
 */

import React, { useState } from 'react';
import { kernel } from '@/lib/feature-kernel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, CheckCircle, XCircle, Play, Download, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { downloadJSON, downloadCSV } from '@/lib/utils/download';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export default function TestsAdminPage() {
  const features = kernel.features;
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestSuite[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  const withE2E = features.filter(f => f.tests.e2e.length > 0).length;
  const withUnit = features.filter(f => f.tests.unit.length > 0).length;
  const withAny = features.filter(f => f.tests.e2e.length > 0 || f.tests.unit.length > 0).length;
  const coveragePct = (withAny / features.length) * 100;

  const runTests = async () => {
    setRunning(true);
    setResults([]);
    setSummary(null);
    setUnsupported(false);

    try {
      const { data, error } = await supabase.functions.invoke('run-tests', {
        body: { suite: 'all' }
      });

      if (error) throw error;

      if (data?.error === 'not_supported') {
        setUnsupported(true);
        toast.error('Tests cannot run in this environment', {
          description: 'Please run tests locally with `npm test` or in CI'
        });
        return;
      }

      if (data?.results) {
        setResults(data.results);
        setSummary(data.summary);
        toast.success('Tests completed', {
          description: `${data.summary.passed}/${data.summary.total} passed`
        });
      }
    } catch (err: any) {
      console.error('Test execution error:', err);
      toast.error('Failed to run tests', {
        description: err.message || 'Unknown error'
      });
    } finally {
      setRunning(false);
    }
  };

  const handleExportJSON = () => {
    if (!results.length) return;
    const exportData = {
      timestamp: new Date().toISOString(),
      summary,
      results
    };
    downloadJSON(exportData, `test-results-${Date.now()}.json`);
    toast.success('Exported test results as JSON');
  };

  const handleExportCSV = () => {
    if (!results.length) return;
    const rows = results.flatMap(suite =>
      suite.tests.map(test => ({
        suite: suite.name,
        test: test.name,
        status: test.status,
        duration: test.duration,
        error: test.error || ''
      }))
    );
    downloadCSV(rows, `test-results-${Date.now()}.csv`);
    toast.success('Exported test results as CSV');
  };

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Testing Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Run tests, view coverage, and track quality metrics
        </p>
      </div>

      <Tabs defaultValue="runner" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runner">Test Runner</TabsTrigger>
          <TabsTrigger value="coverage">Coverage Report</TabsTrigger>
        </TabsList>

        <TabsContent value="runner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Execution</CardTitle>
              <CardDescription>
                Run the test suite and view real-time results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={runTests} disabled={running}>
                  {running ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run All Tests
                    </>
                  )}
                </Button>
                {results.length > 0 && (
                  <>
                    <Button variant="outline" onClick={handleExportJSON}>
                      <Download className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>
                    <Button variant="outline" onClick={handleExportCSV}>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </>
                )}
              </div>

              {unsupported && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Test execution is not supported in this preview environment.
                    Please run <code className="font-mono">npm test</code> locally or check CI results.
                  </AlertDescription>
                </Alert>
              )}

              {summary && (
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{summary.total}</div>
                      <div className="text-sm text-muted-foreground">Total Tests</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                      <div className="text-sm text-muted-foreground">Passed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{summary.duration}ms</div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Test Suites</h3>
                  {results.map((suite, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-base">{suite.name}</CardTitle>
                        <CardDescription>
                          {suite.tests.length} tests · {suite.duration}ms
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {suite.tests.map((test, testIdx) => (
                            <div key={testIdx} className="flex items-center gap-2 text-sm">
                              {test.status === 'passed' && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                              {test.status === 'failed' && (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              {test.status === 'skipped' && (
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                              )}
                              <span className="flex-1">{test.name}</span>
                              <span className="text-muted-foreground">{test.duration}ms</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!running && !results.length && !unsupported && (
                <Alert>
                  <TestTube className="h-4 w-4" />
                  <AlertDescription>
                    No test results yet. Click "Run All Tests" to execute the test suite.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{withE2E}</div>
                <div className="text-sm text-muted-foreground">With E2E Tests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{withUnit}</div>
                <div className="text-sm text-muted-foreground">With Unit Tests</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{features.length - withAny}</div>
                <div className="text-sm text-muted-foreground">No Tests</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feature Coverage</CardTitle>
              <CardDescription>
                {withAny}/{features.length} features covered · {coveragePct.toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Feature</th>
                      <th className="text-left p-3 font-medium">E2E</th>
                      <th className="text-left p-3 font-medium">Unit</th>
                      <th className="text-left p-3 font-medium">Coverage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature) => {
                      const hasE2E = feature.tests.e2e.length > 0;
                      const hasUnit = feature.tests.unit.length > 0;
                      const hasCoverage = hasE2E || hasUnit;

                      return (
                        <tr key={feature.id} className="border-b hover:bg-muted/30">
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{feature.title}</div>
                              <div className="text-xs text-muted-foreground">{feature.id}</div>
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            {hasE2E ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {feature.tests.e2e.length}
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <XCircle className="h-3 w-3 mr-1" />
                                None
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            {hasUnit ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {feature.tests.unit.length}
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <XCircle className="h-3 w-3 mr-1" />
                                None
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {hasCoverage ? (
                              <Badge className="bg-green-500">
                                <TestTube className="h-3 w-3 mr-1" />
                                Covered
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <TestTube className="h-3 w-3 mr-1" />
                                Missing
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
