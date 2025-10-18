/**
 * Test Results Dashboard
 * Displays GitHub Actions test results in an easy-to-read format
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

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

export default function TestResultsPage() {
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [repoInfo, setRepoInfo] = useState({ owner: '', repo: '' });

  const fetchResults = async () => {
    setLoading(true);
    try {
      // You'll need to configure your GitHub repo info
      // For now, using placeholder - user should update this
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
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-load if repo info is available
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

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Results</h1>
          <p className="text-sm text-muted-foreground mt-1">
            GitHub Actions workflow results
          </p>
          {repoInfo.owner && repoInfo.repo && (
            <p className="text-xs text-muted-foreground mt-1">
              {repoInfo.owner}/{repoInfo.repo}
            </p>
          )}
        </div>
        <Button onClick={fetchResults} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Latest Run Summary */}
      {latestRun && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(latestRun.status, latestRun.conclusion)}
                <div>
                  <CardTitle>{latestRun.name}</CardTitle>
                  <CardDescription>
                    Run #{latestRun.run_number} · {new Date(latestRun.created_at).toLocaleString()}
                  </CardDescription>
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
          </CardHeader>
          {latestJobs.length > 0 && (
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-semibold">Jobs</h3>
                {latestJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status, job.conclusion)}
                        <span className="font-medium">{job.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(job.status, job.conclusion)}
                        <Button variant="ghost" size="sm" asChild>
                          <a href={job.html_url} target="_blank" rel="noopener noreferrer">
                            View Logs
                          </a>
                        </Button>
                      </div>
                    </div>
                    {job.steps && job.steps.length > 0 && (
                      <div className="space-y-2 ml-7">
                        {job.steps.map((step) => (
                          <div key={step.number} className="flex items-center gap-2 text-sm">
                            {step.conclusion === 'success' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {step.conclusion === 'failure' && (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            {!step.conclusion && step.status === 'in_progress' && (
                              <Clock className="h-4 w-4 text-blue-500" />
                            )}
                            <span className={step.conclusion === 'failure' ? 'text-red-600 font-medium' : ''}>
                              {step.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Recent Runs */}
      {runs.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
            <CardDescription>Last 10 workflow executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {runs.slice(1).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(run.status, run.conclusion)}
                    <div>
                      <div className="font-medium">{run.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Run #{run.run_number} · {new Date(run.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(run.status, run.conclusion)}
                    <Button variant="ghost" size="sm" asChild>
                      <a href={run.html_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && runs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No test results yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Refresh" to load test results from GitHub Actions
            </p>
            <Button onClick={fetchResults} disabled={loading}>
              Load Results
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
