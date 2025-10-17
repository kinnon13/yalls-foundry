/**
 * Unified Profile Creation Modal
 * 
 * Single searchable list for all entity types with Rocker fallback
 */

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/design/components/Button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, Sparkles, Tractor, MessageCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { emitRockerEvent } from '@/lib/ai/rocker/bus';

type EntityType = 'farm' | 'horse' | 'business' | 'person' | 'stable' | 'breeder' | 'trainer' | 'rider';

interface ProfileType {
  type: EntityType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const PROFILE_TYPES: ProfileType[] = [
  {
    type: 'farm',
    label: 'Farm',
    description: 'Manage your farm operations and facilities',
    icon: Tractor,
    color: 'text-green-600',
  },
  {
    type: 'horse',
    label: 'Horse',
    description: 'Track individual horses and their performance',
    icon: Sparkles,
    color: 'text-purple-600',
  },
  {
    type: 'business',
    label: 'Business',
    description: 'Manage your equestrian business',
    icon: Building2,
    color: 'text-blue-600',
  },
  {
    type: 'person',
    label: 'Producer',
    description: 'Profile for industry producers',
    icon: Users,
    color: 'text-orange-600',
  },
  {
    type: 'stable',
    label: 'Stable',
    description: 'Boarding and training facilities',
    icon: Building2,
    color: 'text-amber-600',
  },
  {
    type: 'breeder',
    label: 'Breeder',
    description: 'Horse breeding operations',
    icon: Sparkles,
    color: 'text-pink-600',
  },
  {
    type: 'trainer',
    label: 'Trainer',
    description: 'Professional training services',
    icon: Users,
    color: 'text-indigo-600',
  },
  {
    type: 'rider',
    label: 'Rider',
    description: 'Competitive rider profiles',
    icon: Users,
    color: 'text-teal-600',
  },
];

export function ProfileCreationModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isOpen = searchParams.get('create') === 'profile';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<EntityType | null>(null);
  const [profileName, setProfileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTypes = PROFILE_TYPES.filter(
    (type) =>
      type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    searchParams.delete('create');
    setSearchParams(searchParams);
    setSelectedType(null);
    setProfileName('');
    setSearchQuery('');
  };

  const handleSelectType = (type: EntityType) => {
    setSelectedType(type);
  };

  const handleCreate = async () => {
    if (!selectedType || !profileName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a type and enter a name',
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
          entity_type: selectedType,
          name: profileName.trim(),
          owner_id: user.id,
          is_claimed: true,
          slug: profileName.trim().toLowerCase().replace(/\s+/g, '-'),
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Log to Rocker
      await emitRockerEvent(
        'user.create.profile',
        user.id,
        {
          entity_type: selectedType,
          entity_id: data.id,
          name: profileName.trim(),
        }
      );

      toast({
        title: 'Success',
        description: `${PROFILE_TYPES.find(t => t.type === selectedType)?.label} profile created`,
      });

      queryClient.invalidateQueries({ queryKey: ['user-entities'] });
      navigate(`/entities/${data.id}`);
      handleClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create profile',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestCustom = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Log request to Rocker for admin escalation
    await emitRockerEvent(
      'user.search',
      user.id,
      {
        search_query: searchQuery,
        requested_type: 'custom_profile',
        context: 'profile_creation',
      }
    );

    // Open Rocker chat with context
    searchParams.set('rocker', 'open');
    searchParams.set('context', JSON.stringify({
      action: 'request_profile_type',
      query: searchQuery,
    }));
    setSearchParams(searchParams);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Profile</DialogTitle>
        </DialogHeader>

        {!selectedType ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search profile types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2">
              {filteredTypes.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center space-y-3">
                    <p className="text-muted-foreground">
                      No profile types match "{searchQuery}"
                    </p>
                    <Button
                      variant="secondary"
                      onClick={handleRequestCustom}
                      className="gap-2"
                    >
                      <MessageCircle size={16} />
                      Request a Profile Type
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {filteredTypes.map((profileType) => {
                    const Icon = profileType.icon;
                    return (
                      <Card
                        key={profileType.type}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleSelectType(profileType.type)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-muted">
                              <Icon className={`h-6 w-6 ${profileType.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">{profileType.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {profileType.description}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <Button
                        variant="ghost"
                        onClick={handleRequestCustom}
                        className="w-full justify-start gap-3"
                      >
                        <MessageCircle size={20} />
                        <div className="text-left">
                          <div className="font-semibold">Request Different Type</div>
                          <div className="text-sm text-muted-foreground">
                            Can't find what you need? Ask Rocker
                          </div>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              {(() => {
                const Icon = PROFILE_TYPES.find(t => t.type === selectedType)?.icon || Building2;
                return <Icon className="h-6 w-6" />;
              })()}
              <div>
                <div className="font-semibold">
                  {PROFILE_TYPES.find(t => t.type === selectedType)?.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {PROFILE_TYPES.find(t => t.type === selectedType)?.description}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Profile Name</label>
              <Input
                placeholder={`Enter ${PROFILE_TYPES.find(t => t.type === selectedType)?.label.toLowerCase()} name`}
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setSelectedType(null)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !profileName.trim()}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create Profile'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
