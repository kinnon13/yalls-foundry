/**
 * ContextKernelHost - Dynamically spawns feature kernels based on user relationships
 * 
 * Usage: Renders on dashboard to show context-aware features like:
 * - Incentives for horses user owns that are entered
 * - Jobs assigned to contractor/subcontractor
 * - Events user is attending
 * - Farms/entities user follows
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openKernel } from './contextUtils';
import { useState } from 'react';

interface KernelContext {
  kernel_id: string;
  kernel_type: string;
  context_entity_id: string | null;
  context_data: Record<string, any>;
  source: string;
  priority: number;
  entity_display_name: string | null;
  next_cursor?: string;
}

const kernelTypeLabels: Record<string, { title: string; description: string }> = {
  incentive_entry: {
    title: 'Incentive Entry',
    description: 'Your horses in active incentives',
  },
  event_participant: {
    title: 'Event',
    description: 'Events you\'re participating in',
  },
  job_assignment: {
    title: 'Job Assignment',
    description: 'Work assigned to you',
  },
  farm_updates: {
    title: 'Farm Updates',
    description: 'Updates from farms you follow',
  },
  listing_inquiry: {
    title: 'Listing Inquiry',
    description: 'Inquiries on your listings',
  },
};

export function ContextKernelHost() {
  const [cursor, setCursor] = useState<string | null>(null);
  
  const { data: kernels = [], isLoading } = useQuery({
    queryKey: ['user-kernels', cursor],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_user_kernels', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_limit: 24,
        p_cursor: cursor ? parseInt(cursor) : null,
      });
      
      if (error) throw error;
      
      // Log kernel renders for observability
      const kernelData = (data || []) as KernelContext[];
      kernelData.forEach((kernel) => {
        (supabase as any)
          .rpc('rpc_observe', {
            p_rpc_name: 'kernel_render',
            p_duration_ms: 0,
            p_status: 'ok',
            p_error_code: null,
            p_meta: {
              type: kernel.kernel_type,
              source: kernel.source,
              outcome: 'shown',
              surface: 'kernel',
            },
          })
          .catch(() => void 0);
      });
      
      return kernelData;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (kernels.length === 0) {
    return null;
  }

  const handleOpenKernel = (kernel: KernelContext) => {
    openKernel({
      kernelType: kernel.kernel_type,
      contextData: kernel.context_data,
      returnTo: window.location.pathname + window.location.search,
    });
  };

  const hasNextPage = kernels.length > 0 && kernels[kernels.length - 1]?.next_cursor;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Active Items</h2>
        <p className="text-sm text-muted-foreground">
          Quick access to your entries, jobs, and followed content
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kernels.map((kernel) => {
          const labels = kernelTypeLabels[kernel.kernel_type] || {
            title: kernel.kernel_type.replace(/_/g, ' '),
            description: '',
          };

          return (
            <Card key={kernel.kernel_id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {labels.title}
                    </CardTitle>
                    {kernel.entity_display_name && (
                      <CardDescription className="text-sm font-medium mt-1">
                        {kernel.entity_display_name}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {kernel.source}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {labels.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {labels.description}
                  </p>
                )}
                
                {/* Context-specific metadata */}
                {kernel.context_data && Object.keys(kernel.context_data).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(kernel.context_data).map(([key, value]) => {
                      if (key === 'status' || key === 'priority') {
                        return (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {String(value)}
                          </Badge>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                <Button 
                  onClick={() => handleOpenKernel(kernel)}
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  Open <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setCursor(kernels[kernels.length - 1].next_cursor!)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
