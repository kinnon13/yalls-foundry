import { useEntityEdges } from '@/hooks/useEntityEdges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, X, Building2, Users, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface EdgesManagerProps {
  entityId: string;
  canManage?: boolean;
}

export function EdgesManager({ entityId, canManage = false }: EdgesManagerProps) {
  const { data: edges = [], isLoading, update, remove } = useEntityEdges(entityId);

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  if (edges.length === 0 && !canManage) {
    return null;
  }

  const edgeTypeLabels = {
    owns: 'Owns',
    manages: 'Manages',
    parent: 'Parent',
    sponsors: 'Sponsors',
    partners: 'Partners with',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Relationships
          </CardTitle>
          {canManage && (
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Relationship
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {edges.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No relationships defined</p>
        ) : (
          edges.map((edge) => (
            <div key={edge.id} className="flex items-center justify-between p-4 border rounded-lg group">
              <div className="flex items-center gap-3 flex-1">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{edgeTypeLabels[edge.edge_type]}</p>
                  <p className="text-sm text-muted-foreground">Entity {edge.to_entity_id.slice(0, 8)}</p>
                </div>
              </div>

              {canManage && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`crosspost-${edge.id}`}
                      checked={edge.allow_crosspost}
                      onCheckedChange={(checked) =>
                        update.mutate({ edge_id: edge.id, options: { allow_crosspost: checked } })
                      }
                    />
                    <Label htmlFor={`crosspost-${edge.id}`} className="text-sm">
                      Cross-post
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id={`auto-${edge.id}`}
                      checked={edge.auto_propagate}
                      onCheckedChange={(checked) =>
                        update.mutate({ edge_id: edge.id, options: { auto_propagate: checked } })
                      }
                    />
                    <Label htmlFor={`auto-${edge.id}`} className="text-sm">
                      Auto
                    </Label>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => remove.mutate(edge.id)}
                    aria-label="Remove relationship"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
