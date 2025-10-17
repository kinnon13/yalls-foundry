/**
 * Global Error Boundary (Task 26)
 * Production-grade error recovery with Mac polish
 */

import React from 'react';
import { normalizeError } from '@/lib/errors';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FallbackProps {
  error: Error;
  reset: () => void;
}

function DefaultFallback({ error, reset }: FallbackProps) {
  const normalized = normalizeError(error);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">
              {normalized.rateLimited ? 'Slow down there' : 'Something went wrong'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {normalized.rateLimited
                ? "You're moving too fast"
                : 'An unexpected error occurred'}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            {normalized.rateLimited
              ? 'Too many requests. Please wait a moment and try again.'
              : error.message}
          </p>
        </div>

        <button
          onClick={reset}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: (p: FallbackProps) => React.ReactNode }>,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught:', error, errorInfo);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const Fallback = this.props.fallback || DefaultFallback;
      return <Fallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}
