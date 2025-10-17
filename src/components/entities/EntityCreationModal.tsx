/**
 * Unified Entity Creation/Claim Modal
 * 
 * Allows users to:
 * 1. Create new entities (farm/horse/business/person)
 * 2. Claim unclaimed entities
 * 
 * Controlled via URL params: /?entity=farm or /?entity=claim
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/design/components/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Sparkles, Tractor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { rpcWithObs } from '@/lib/supaRpc';

type EntityType = 'farm' | 'horse' | 'business' | 'person';

interface UnclaimedEntity {
  id: string;
  entity_type: EntityType;
  name: string;
  is_claimed: boolean;
}

const ENTITY_CONFIG = {
  farm: { icon: Tractor, label: 'Farm', color: 'text-green-600' },
  horse: { icon: Sparkles, label: 'Horse', color: 'text-purple-600' },
  business: { icon: Building2, label: 'Business', color: 'text-blue-600' },
  person: { icon: Users, label: 'Producer', color: 'text-orange-600' },
};

export function EntityCreationModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const entityParam = searchParams.get('entity');
  const isOpen = !!entityParam;
  
  const [mode, setMode] = useState<'create' | 'claim'>('create');
  const [entityType, setEntityType] = useState<EntityType>('farm');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Unclaimed entities for claiming
  const [unclaimedEntities, setUnclaimedEntities] = useState<UnclaimedEntity[]>([]);
  const [loadingUnclaimed, setLoadingUnclaimed] = useState(false);

  useEffect(() => {
    if (entityParam && entityParam !== 'claim') {
      setMode('create');
      setEntityType(entityParam as EntityType);
    } else if (entityParam === 'claim') {
      setMode('claim');
      fetchUnclaimedEntities();
    }
  }, [entityParam]);

  const fetchUnclaimedEntities = async () => {
    setLoadingUnclaimed(true);
    try {
      const { data, error } = await supabase
        .from('entity_profiles')
        .select('id, entity_type, name, is_claimed')
        .eq('is_claimed', false)
        .limit(20);

      if (!error && data) {
        setUnclaimedEntities(data as any);
      }
    } catch (err) {
      console.error('Error fetching unclaimed entities:', err);
    } finally {
      setLoadingUnclaimed(false);
    }
  };

  const handleClose = () => {
    searchParams.delete('entity');
    setSearchParams(searchParams);
    setDisplayName('');
  };

  const handleCreate = async () => {
    if (!displayName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your entity',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('entity_profiles')
        .insert({
          entity_type: entityType,
          name: displayName.trim(),
          owner_id: user.id,
          is_claimed: true,
          slug: displayName.trim().toLowerCase().replace(/\s+/g, '-'),
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${ENTITY_CONFIG[entityType].label} created successfully`,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user-entities'] });

      // Navigate to the new entity
      navigate(`/entities/${data.id}`);
      handleClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create entity',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async (entityId: string) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await rpcWithObs(
        'claim_entity_profile',
        { p_entity_id: entityId },
        { surface: 'entity_creation_modal' }
      );

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Entity claimed successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['user-entities'] });
      navigate(`/entities/${entityId}`);
      handleClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to claim entity',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Entity</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'create' | 'claim')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="claim">Claim Existing</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.entries(ENTITY_CONFIG) as [EntityType, typeof ENTITY_CONFIG[EntityType]][]).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                  <Button
                    key={type}
                    variant={entityType === type ? 'secondary' : 'ghost'}
                    onClick={() => setEntityType(type)}
                    className="flex flex-col h-auto py-4"
                  >
                      <Icon className={`h-6 w-6 mb-2 ${config.color}`} />
                      <span className="text-sm">{config.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder={`Enter ${ENTITY_CONFIG[entityType].label.toLowerCase()} name`}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !displayName.trim()}
              className="w-full"
            >
              {isSubmitting ? 'Creating...' : `Create ${ENTITY_CONFIG[entityType].label}`}
            </Button>
          </TabsContent>

          <TabsContent value="claim" className="mt-4">
            {loadingUnclaimed ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : unclaimedEntities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No unclaimed entities available
              </div>
            ) : (
              <div className="space-y-2">
                {unclaimedEntities.map((entity) => {
                  const Icon = ENTITY_CONFIG[entity.entity_type as EntityType].icon;
                  return (
                    <Card key={entity.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{entity.name}</div>
                              <div className="text-sm text-muted-foreground capitalize">
                                {entity.entity_type}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="s"
                            onClick={() => handleClaim(entity.id)}
                            disabled={isSubmitting}
                          >
                            Claim
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
