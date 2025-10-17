/**
 * Debug Overlay
 * 
 * Diagnostic panel for feature-islands debugging
 * Activated by ?debug=1
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { X, Activity, Code, AlertTriangle } from 'lucide-react';
import { featureRegistry } from './registry';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function DebugOverlay() {
  const [sp] = useSearchParams();
  const isDebug = sp.get('debug') === '1';
  const [isVisible, setIsVisible] = useState(false);
  const f = (sp.get('f') ?? '').split(',').filter(Boolean);

  useEffect(() => {
    if (isDebug) {
      setIsVisible(true);
    }
  }, [isDebug]);

  const { data: rpcMetrics } = useQuery({
    queryKey: ['rpc-metrics-debug'],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any).rpc('rpc_metrics', { p_window_minutes: 60 });
        if (error) throw error;
        return data || [];
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('Failed to load RPC metrics:', e);
        }
        return [];
      }
    },
    enabled: isVisible,
    refetchInterval: 30000,
  });

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] z-50">
      <Card className="border-2 border-primary/50 shadow-lg">
        <CardHeader className="bg-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle className="text-sm">Feature Kernel Debug</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="s"
              onClick={() => setIsVisible(false)}
            >
              <X size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Active Features */}
          <div>
            <div className="text-xs font-medium mb-2 flex items-center gap-2">
              <Code size={12} />
              Active Features ({f.length})
            </div>
            {f.length === 0 ? (
              <div className="text-xs text-muted-foreground">No features mounted</div>
            ) : (
              <div className="space-y-2">
                {f.map((id) => {
                  const def = featureRegistry[id];
                  const props: Record<string, string> = {};
                  sp.forEach((v, k) => {
                    if (k.startsWith(`fx.${id}.`)) {
                      props[k.slice(`fx.${id}.`.length)] = v;
                    }
                  });

                  return (
                    <div
                      key={id}
                      className="p-2 bg-muted/50 rounded text-xs space-y-1"
                    >
                      <div className="font-medium">{id}</div>
                      {def && (
                        <div className="text-muted-foreground">
                          v{def.version} • {def.capabilities?.join(', ')}
                        </div>
                      )}
                      {Object.keys(props).length > 0 && (
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {JSON.stringify(props, null, 2)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RPC Performance */}
          {rpcMetrics && rpcMetrics.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-2 flex items-center gap-2">
                <Activity size={12} />
                RPC Performance (60m)
              </div>
              <div className="space-y-1">
                {rpcMetrics.slice(0, 5).map((metric: any) => (
                  <div
                    key={metric.rpc_name}
                    className="p-2 bg-muted/50 rounded text-xs flex justify-between"
                  >
                    <span className="font-mono text-[10px]">{metric.rpc_name}</span>
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span>p95: {Math.round(metric.p95_ms)}ms</span>
                      <span
                        className={
                          metric.error_rate_pct > 2 ? 'text-destructive font-medium' : ''
                        }
                      >
                        err: {metric.error_rate_pct?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registry Info */}
          <div>
            <div className="text-xs font-medium mb-2">Registry</div>
            <div className="text-[10px] text-muted-foreground space-y-1">
              <div>Features: {Object.keys(featureRegistry).length}</div>
              <div className="font-mono">
                {Object.keys(featureRegistry).join(', ')}
              </div>
            </div>
          </div>

          {/* URL */}
          <div>
            <div className="text-xs font-medium mb-2">Current URL</div>
            <div className="p-2 bg-muted/50 rounded font-mono text-[10px] break-all">
              {window.location.href}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
