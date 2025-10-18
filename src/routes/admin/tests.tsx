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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Test execution is not available in the preview environment.</strong>
              <br />
              Tests require Node.js, npm, and access to the project filesystem. 
              Please run tests locally or view results in GitHub Actions CI.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>How to Run Tests</CardTitle>
              <CardDescription>
                Execute tests locally or in your CI pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">Local Development</h4>
                  <code className="block bg-muted p-2 rounded text-sm">
                    npm test
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run all unit tests with coverage
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">Watch Mode (Development)</h4>
                  <code className="block bg-muted p-2 rounded text-sm">
                    npm test -- --watch
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run tests in watch mode for active development
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">E2E Tests</h4>
                  <code className="block bg-muted p-2 rounded text-sm">
                    npm run test:e2e
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run end-to-end tests with Playwright
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">GitHub Actions CI</h4>
                  <p className="text-sm text-muted-foreground">
                    Tests run automatically on every push and pull request.
                    Check the <strong>Actions</strong> tab in your GitHub repository.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CI Workflows</CardTitle>
              <CardDescription>
                Automated testing in GitHub Actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>.github/workflows/show-your-work.yml</strong>
                    <p className="text-muted-foreground">
                      Validates architecture, work reports, and runs unit tests
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <strong>.github/workflows/admin-tests.yml</strong>
                    <p className="text-muted-foreground">
                      Tests admin panel routes, legacy aliases, and type safety
                    </p>
                  </div>
                </div>
              </div>
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
