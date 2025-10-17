import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EntityClaimBanner } from '@/components/entities/EntityClaimBanner';
import { ContributorCredit } from '@/components/entities/ContributorCredit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type Entity = {
  id: string;
  kind: string;
  handle: string | null;
  display_name: string;
  status: 'unclaimed' | 'claimed' | 'verified';
  owner_user_id: string | null;
  created_by_user_id: string | null;
  contributor_window_days: number;
  window_expires_at: string | null;
  provenance: any;
  metadata: any;
  created_at: string;
};

export default function EntityDetail() {
  const { id } = useParams();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setEntity(data as Entity);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Entity not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {entity.status === 'unclaimed' && (
        <EntityClaimBanner
          entityId={entity.id}
          status={entity.status}
          provenance={entity.provenance}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{entity.display_name}</CardTitle>
              {entity.handle && (
                <p className="text-sm text-muted-foreground">@{entity.handle}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="capitalize">
                {entity.kind}
              </Badge>
              <Badge
                variant={
                  entity.status === 'verified'
                    ? 'default'
                    : entity.status === 'claimed'
                    ? 'secondary'
                    : 'outline'
                }
                className="capitalize"
              >
                {entity.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {entity.created_by_user_id && (
            <div className="flex items-center gap-2">
              <ContributorCredit entityId={entity.id} />
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Details</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">
                  {new Date(entity.created_at).toLocaleDateString()}
                </dd>
              </div>
              {entity.window_expires_at && (
                <div>
                  <dt className="text-muted-foreground">Window Expires</dt>
                  <dd className="font-medium">
                    {new Date(entity.window_expires_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {entity.provenance?.source && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="font-medium">{entity.provenance.source}</dd>
                </div>
              )}
            </dl>
          </div>

          {Object.keys(entity.metadata).length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Additional Information</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(entity.metadata, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
