import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EntityEdges, type EdgeType } from '@/ports';
import { useToast } from '@/hooks/use-toast';

export function useEntityEdges(entityId: string, direction: 'from' | 'to' | 'both' = 'from') {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: edges = [], isLoading, error } = useQuery({
    queryKey: ['entity-edges', entityId, direction],
    queryFn: () => EntityEdges.list(entityId, direction),
    enabled: !!entityId,
  });

  const create = useMutation({
    mutationFn: ({ fromEntityId, toEntityId, edgeType, metadata }: {
      fromEntityId: string;
      toEntityId: string;
      edgeType: EdgeType;
      metadata?: Record<string, any>;
    }) => EntityEdges.create(fromEntityId, toEntityId, edgeType, metadata),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity-edges'] });
      toast({ title: 'Relationship created' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create relationship', 
        description: String(error), 
        variant: 'destructive' 
      });
    },
  });

  const update = useMutation({
    mutationFn: ({ edgeId, edgeType, metadata }: {
      edgeId: string;
      edgeType?: EdgeType;
      metadata?: Record<string, any>;
    }) => EntityEdges.update(edgeId, edgeType, metadata),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity-edges'] });
      toast({ title: 'Relationship updated' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update relationship', 
        description: String(error), 
        variant: 'destructive' 
      });
    },
  });

  const remove = useMutation({
    mutationFn: (edgeId: string) => EntityEdges.remove(edgeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity-edges'] });
      toast({ title: 'Relationship removed' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to remove relationship', 
        description: String(error), 
        variant: 'destructive' 
      });
    },
  });

  const setPermissions = useMutation({
    mutationFn: ({ entityId, userId, canPost, canManage }: {
      entityId: string;
      userId: string;
      canPost: boolean;
      canManage: boolean;
    }) => EntityEdges.setPermissions(entityId, userId, canPost, canManage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity-edges'] });
      toast({ title: 'Permissions updated' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update permissions', 
        description: String(error), 
        variant: 'destructive' 
      });
    },
  });

  return { edges, isLoading, error, create, update, remove, setPermissions };
}
