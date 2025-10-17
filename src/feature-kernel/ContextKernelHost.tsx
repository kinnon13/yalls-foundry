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

interface KernelContext {
  kernel_id: string;
  kernel_type: string;
  context_entity_id: string | null;
  context_data: Record<string, any>;
  source: string;
  priority: number;
  entity_display_name: string | null;
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
  const { data: kernels = [], isLoading } = useQuery({
    queryKey: ['user-kernels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_kernels');
      
      if (error) throw error;
      return (data || []) as KernelContext[];
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
    // Build feature URL with context
    const params = new URLSearchParams({
      f: kernel.kernel_type,
      ctx: kernel.kernel_id,
    });
    
    // Add context-specific params
    if (kernel.context_data) {
      Object.entries(kernel.context_data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    window.location.href = `/dashboard?${params.toString()}`;
  };

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
    </div>
  );
}
