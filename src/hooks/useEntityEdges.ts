import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EntityEdges, type EdgeType } from '@/ports';
import { useToast } from '@/hooks/use-toast';

export function useEntityEdges(entity_id: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const edgesQ = useQuery({
    queryKey: ['entityEdges', entity_id],
    queryFn: () => EntityEdges.list(entity_id),
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: ({ to_entity_id, edge_type, options }: { to_entity_id: string; edge_type: EdgeType; options?: { allow_crosspost?: boolean; auto_propagate?: boolean } }) =>
      EntityEdges.create(entity_id, to_entity_id, edge_type, options),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entityEdges', entity_id] });
      toast({ title: 'Relationship created' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create relationship', description: String(error), variant: 'destructive' });
    },
  });

  const update = useMutation({
    mutationFn: ({ edge_id, options }: { edge_id: string; options: { allow_crosspost?: boolean; auto_propagate?: boolean } }) =>
      EntityEdges.update(edge_id, options),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entityEdges', entity_id] });
      toast({ title: 'Relationship updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update relationship', description: String(error), variant: 'destructive' });
    },
  });

  const remove = useMutation({
    mutationFn: (edge_id: string) => EntityEdges.remove(edge_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entityEdges', entity_id] });
      toast({ title: 'Relationship removed' });
    },
    onError: (error) => {
      toast({ title: 'Failed to remove relationship', description: String(error), variant: 'destructive' });
    },
  });

  return { ...edgesQ, create, update, remove };
}
