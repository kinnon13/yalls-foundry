/**
 * Feature Error Boundary
 * 
 * Per-feature isolation: faults don't cascade
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Card, CardContent } from '@/components/ui/card';
import { rpcWithObs } from '@/lib/supaRpc';

interface Props {
  featureId: string;
  children: ReactNode;
}

interface State {
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Feature ${this.props.featureId} crashed:`, error, errorInfo);
    
    // Log to observability without crashing the page
    try {
      await rpcWithObs(
        'rpc_observe',
        {
          rpc_name: 'feature_crash',
          duration_ms: 0,
          status: 'error' as const,
          error_code: 'FEATURE_CRASH',
          meta: {
            feature: this.props.featureId,
            error: error.message,
            stack: error.stack?.slice(0, 500),
          },
        },
        { surface: 'feature_kernel' }
      );
    } catch (e) {
      console.error('Failed to log feature crash:', e);
    }
  }

  handleRetry = () => {
    this.setState({ error: undefined, errorInfo: undefined });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <Card className="border-destructive/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-destructive mb-1">
                Feature crashed
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {this.props.featureId}
              </div>
              <div className="text-xs text-muted-foreground mb-3 font-mono bg-muted p-2 rounded">
                {this.state.error.message}
              </div>
              <Button
                variant="secondary"
                size="s"
                onClick={this.handleRetry}
              >
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}
