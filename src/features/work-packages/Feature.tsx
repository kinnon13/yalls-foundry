/**
 * Work Packages Feature
 * GC/subcontractor pattern - scoped task management for assigned roles
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkPackagesFeatureProps {
  project?: string;
  role?: 'plumber' | 'electrician' | 'framer' | 'general' | 'other';
  range?: 'week' | 'month';
}

export default function WorkPackagesFeature(props: WorkPackagesFeatureProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch work packages
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['work-packages', props.project, props.role],
    queryFn: async () => {
      let query = supabase
        .from('work_packages')
        .select('*')
        .order('due_date', { ascending: true });

      if (props.project) {
        query = query.eq('project_id', props.project);
      }

      if (props.role) {
        query = query.eq('role', props.role);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('work_packages')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Work package updated',
      });
      queryClient.invalidateQueries({ queryKey: ['work-packages'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update work package',
        variant: 'destructive',
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'review':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'complete':
        return 'default';
      case 'in_progress':
        return 'default';
      case 'review':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Packages
            {props.role && (
              <Badge variant="outline" className="ml-2">
                {props.role}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {props.project 
              ? 'Your assigned tasks for this project'
              : 'All your work assignments'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No work packages assigned
            </div>
          ) : (
            <div className="space-y-4">
              {packages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getStatusIcon(pkg.status)}
                          {pkg.title}
                        </CardTitle>
                        <CardDescription>
                          {pkg.description}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusColor(pkg.status) as any}>
                        {pkg.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {pkg.due_date && (
                          <span>Due: {new Date(pkg.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {pkg.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: pkg.id,
                                status: 'in_progress',
                              })
                            }
                          >
                            Start
                          </Button>
                        )}
                        {pkg.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: pkg.id,
                                status: 'review',
                              })
                            }
                          >
                            Submit for Review
                          </Button>
                        )}
                        {pkg.status === 'review' && (
                          <Badge variant="secondary">Awaiting Review</Badge>
                        )}
                        {pkg.status === 'complete' && (
                          <Badge variant="default">Complete</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
