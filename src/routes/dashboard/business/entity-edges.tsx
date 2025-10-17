import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Network, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface EntityEdge {
  from_entity_id: string;
  from_entity_name: string;
  to_entity_id: string;
  to_entity_name: string;
  edge_type: string;
  allow_crosspost: boolean;
  auto_propagate: boolean;
  require_approval: boolean;
  created_at: string;
}

export default function EntityEdgesManager({ entityId }: { entityId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [targetEntityId, setTargetEntityId] = useState('');
  const [edgeType, setEdgeType] = useState<string>('owns');
  const [allowCrosspost, setAllowCrosspost] = useState(false);
  const [autoPropagate, setAutoPropagate] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);

  // Load edges
  const { data: edges, isLoading } = useQuery({
    queryKey: ['entity-edges', entityId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('entity_edges_get', {
        p_entity_id: entityId,
      });
      if (error) throw error;
      return data as EntityEdge[];
    },
    enabled: !!entityId,
  });

  // Load available entities for connection
  const { data: entities } = useQuery({
    queryKey: ['entities-owned'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('entities')
        .select('id, display_name, kind')
        .eq('owner_user_id', user.id)
        .neq('id', entityId); // Exclude current entity

      if (error) throw error;
      return data;
    },
  });

  // Create/update edge
  const upsertEdge = useMutation({
    mutationFn: async () => {
      if (!targetEntityId) throw new Error('Select a target entity');

      const { error } = await supabase.rpc('entity_edge_upsert', {
        p_from_entity_id: entityId,
        p_to_entity_id: targetEntityId,
        p_edge_type: edgeType,
        p_allow_crosspost: allowCrosspost,
        p_auto_propagate: autoPropagate,
        p_require_approval: requireApproval,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-edges'] });
      setIsCreating(false);
      setTargetEntityId('');
      setAllowCrosspost(false);
      setAutoPropagate(false);
      setRequireApproval(true);
      toast({ title: 'Edge created successfully' });
    },
    onError: (err) => {
      toast({ title: 'Failed to create edge', description: String(err), variant: 'destructive' });
    },
  });

  // Delete edge
  const deleteEdge = useMutation({
    mutationFn: async ({ fromId, toId, type }: { fromId: string; toId: string; type: string }) => {
      const { error } = await supabase
        .from('entity_edges')
        .delete()
        .match({ from_entity_id: fromId, to_entity_id: toId, edge_type: type });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-edges'] });
      toast({ title: 'Edge deleted' });
    },
    onError: (err) => {
      toast({ title: 'Failed to delete', description: String(err), variant: 'destructive' });
    },
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                <CardTitle>Entity Relationships</CardTitle>
              </div>
              <CardDescription>
                Connect entities to enable cross-posting and auto-propagation
              </CardDescription>
            </div>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Edge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Entity Edge</DialogTitle>
                  <DialogDescription>
                    Define how entities relate and control content propagation
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Target Entity</Label>
                    <Select value={targetEntityId} onValueChange={setTargetEntityId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity" />
                      </SelectTrigger>
                      <SelectContent>
                        {entities?.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.display_name} ({e.kind})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Relationship Type</Label>
                    <Select value={edgeType} onValueChange={setEdgeType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owns">Owns</SelectItem>
                        <SelectItem value="manages">Manages</SelectItem>
                        <SelectItem value="brand_of">Brand Of</SelectItem>
                        <SelectItem value="offspring_of">Offspring Of</SelectItem>
                        <SelectItem value="sibling_of">Sibling Of</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Cross-Post</Label>
                        <p className="text-sm text-muted-foreground">
                          Target entity can post to this entity
                        </p>
                      </div>
                      <Switch checked={allowCrosspost} onCheckedChange={setAllowCrosspost} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Propagate</Label>
                        <p className="text-sm text-muted-foreground">
                          Posts automatically appear on target entity
                        </p>
                      </div>
                      <Switch checked={autoPropagate} onCheckedChange={setAutoPropagate} />
                    </div>

                    {allowCrosspost && (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Require Approval</Label>
                          <p className="text-sm text-muted-foreground">
                            Cross-posts need manual approval
                          </p>
                        </div>
                        <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => upsertEdge.mutate()} disabled={upsertEdge.isPending}>
                    {upsertEdge.isPending ? 'Creating...' : 'Create Edge'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!edges || edges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No edges configured yet</p>
              <p className="text-sm">Create edges to enable cross-posting and auto-propagation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {edges.map((edge) => (
                <Card key={`${edge.from_entity_id}-${edge.to_entity_id}-${edge.edge_type}`}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">{edge.from_entity_name}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{edge.to_entity_name}</span>
                      </div>
                      <div className="ml-4 px-3 py-1 bg-muted rounded-full text-sm capitalize">
                        {edge.edge_type.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        {edge.allow_crosspost ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-muted-foreground">Cross-post</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {edge.auto_propagate ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-muted-foreground">Auto-propagate</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteEdge.mutate({
                            fromId: edge.from_entity_id,
                            toId: edge.to_entity_id,
                            type: edge.edge_type,
                          })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Edge Use Cases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span className="font-medium">Offspring Of:</span>
            <span>Foal → Sire/Dam (auto-propagate pedigree posts)</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium">Brand Of:</span>
            <span>Sub-brand → Parent brand (requires approval)</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium">Manages:</span>
            <span>Farm → Stallion (cross-post allowed)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
