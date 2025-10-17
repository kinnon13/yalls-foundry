/**
 * Feature Error Boundary
 * 
 * Per-feature isolation: faults don't cascade
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

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
    if (import.meta.env.DEV) {
      console.error(`Feature ${this.props.featureId} crashed:`, error, errorInfo);
    }
    
    // Log to observability without crashing the page (fire-and-forget)
    try {
      (supabase as any).rpc('rpc_observe', {
        p_rpc_name: 'feature_crash',
        p_duration_ms: 0,
        p_status: 'error',
        p_error_code: 'FEATURE_CRASH',
        p_meta: {
          feature: this.props.featureId,
          error: error.message,
          stack: error.stack?.slice(0, 500),
        }
      }).catch(() => void 0);
    } catch {
      // Silent - logging failures shouldn't break UX
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
