/**
 * Horse Detail Page
 * 
 * View and claim horse profile
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { entityProfileService } from '@/lib/profiles/entity-service';
import { toast } from 'sonner';
import { Zap, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function HorseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: horse, isLoading } = useQuery({
    queryKey: ['horse', id],
    queryFn: () => entityProfileService.getById(id!),
    enabled: !!id,
  });

  const { data: canClaim } = useQuery({
    queryKey: ['horse', id, 'canClaim'],
    queryFn: () => entityProfileService.canClaim(id!),
    enabled: !!id && !!horse && !horse.is_claimed,
  });

  const claimMutation = useMutation({
    mutationFn: () => entityProfileService.claim(id!),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Horse claimed successfully!', {
          description: 'You are now the owner of this horse.',
        });
        queryClient.invalidateQueries({ queryKey: ['horse', id] });
        queryClient.invalidateQueries({ queryKey: ['horse', id, 'canClaim'] });
      } else {
        toast.error('Failed to claim horse', {
          description: result.message || 'This horse may already be claimed.',
        });
      }
    },
    onError: (error) => {
      console.error('Claim error:', error);
      toast.error('Failed to claim horse');
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!id) return;

    const unsubscribe = entityProfileService.subscribeToEntity(id, (payload) => {
      console.log('[HorseDetail] Realtime update:', payload);
      queryClient.invalidateQueries({ queryKey: ['horse', id] });
      
      if (payload.eventType === 'UPDATE' && payload.new.is_claimed && !payload.old.is_claimed) {
        toast.info('This horse was just claimed!');
      }
    });

    return unsubscribe;
  }, [id, queryClient]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12 text-muted-foreground">
          Loading horse details...
        </div>
      </div>
    );
  }

  if (!horse) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Horse not found. It may have been deleted.
          </AlertDescription>
        </Alert>
        <Link to="/horses">
          <Button variant="ghost" className="gap-2 mt-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Horses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      <Link to="/horses">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Horses
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Zap className="h-8 w-8" />
                {horse.name}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {horse.description || 'No description provided'}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              {horse.is_claimed ? (
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  Claimed
                </Badge>
              ) : (
                <Badge variant="outline">Unclaimed</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Claim Button */}
          {!horse.is_claimed && canClaim && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>This horse is available to claim</span>
                <Button 
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isPending}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  {claimMutation.isPending ? 'Claiming...' : 'Claim Horse'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Horse Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Basic Information</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Slug:</dt>
                  <dd className="font-mono">{horse.slug}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Entity Type:</dt>
                  <dd className="capitalize">{horse.entity_type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created:</dt>
                  <dd>{new Date(horse.created_at).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Last Updated:</dt>
                  <dd>{new Date(horse.updated_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            {horse.custom_fields && Object.keys(horse.custom_fields).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Additional Details</h3>
                <dl className="space-y-2 text-sm">
                  {Object.entries(horse.custom_fields).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <dt className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
