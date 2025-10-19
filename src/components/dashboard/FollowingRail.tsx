/**
 * Following Rail
 * Shows followed/favorited entities with quick access to their pinned apps
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, UserPlus, Calendar, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePinboard } from '@/library/pinboard';

interface FollowedEntity {
  id: string;
  entityId: string;
  edgeType: 'follow' | 'favorite';
  entityName?: string;
  entityType?: string;
  scope: { apps?: string[] };
}

export function FollowingRail() {
  const [followed, setFollowed] = useState<FollowedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { getPins } = usePinboard();

  useEffect(() => {
    async function loadFollowed() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('connection_edges')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Load entity details
        const enriched = await Promise.all(
          data.map(async (edge) => {
            const { data: entity } = await supabase
              .from('entities')
              .select('display_name, kind')
              .eq('id', edge.entity_id)
              .single();

            return {
              id: edge.id,
              entityId: edge.entity_id,
              edgeType: edge.edge_type as 'follow' | 'favorite',
              entityName: entity?.display_name || 'Unknown',
              entityType: entity?.kind || 'user',
              scope: edge.scope as any,
            };
          })
        );

        setFollowed(enriched);
      }
      setLoading(false);
    }

    loadFollowed();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Following</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (followed.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Following</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Follow profiles to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Following</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {followed.map((entity) => {
          const pins = getPins(entity.entityId);
          const appCount = entity.scope.apps?.length || pins.length;

          return (
            <div
              key={entity.id}
              className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => navigate(`/profile/${entity.entityId}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {entity.edgeType === 'favorite' ? (
                    <Heart className="h-4 w-4 text-primary fill-current" />
                  ) : (
                    <UserPlus className="h-4 w-4 text-primary" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{entity.entityName}</p>
                    <p className="text-xs text-muted-foreground">
                      {appCount} {appCount === 1 ? 'app' : 'apps'}
                    </p>
                  </div>
                </div>
              </div>

              {pins.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {pins.slice(0, 3).map((pin) => (
                    <Button
                      key={pin.appId}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/?app=${pin.appId}&entity=${entity.entityId}`);
                      }}
                    >
                      {pin.appId === 'calendar' && <Calendar className="h-3 w-3 mr-1" />}
                      {pin.appId === 'listings' && <ShoppingBag className="h-3 w-3 mr-1" />}
                      {pin.appId}
                    </Button>
                  ))}
                  {pins.length > 3 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{pins.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
