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
import { Building2, Users, Sparkles, Tractor, MessageCircle, Search, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { emitRockerEvent } from '@/lib/ai/rocker/bus';

type EntityType = 'horse' | 'business' | 'owner' | 'stable' | 'breeder' | 'rider' | 'event' | 'profile';

interface ProfileType {
  type: EntityType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const PROFILE_TYPES: ProfileType[] = [
  {
    type: 'business',
    label: 'Business',
    description: 'Manage your equestrian business',
    icon: Building2,
    color: 'text-blue-600',
  },
  {
    type: 'horse',
    label: 'Horse',
    description: 'Track individual horses and their performance',
    icon: Sparkles,
    color: 'text-purple-600',
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
    type: 'rider',
    label: 'Rider',
    description: 'Competitive rider profiles',
    icon: Users,
    color: 'text-teal-600',
  },
  {
    type: 'owner',
    label: 'Owner',
    description: 'Horse owner profiles',
    icon: Users,
    color: 'text-orange-600',
  },
  {
    type: 'event',
    label: 'Event',
    description: 'Competition and show events',
    icon: Tractor,
    color: 'text-green-600',
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

  // Fetch unclaimed profiles when a type is selected
  const { data: unclaimedProfiles = [], isLoading: loadingUnclaimed, error: unclaimedError } = useQuery({
    queryKey: ['unclaimed-profiles', selectedType],
    queryFn: async () => {
      if (!selectedType) return [];
      
      console.log('Fetching unclaimed profiles for type:', selectedType);
      
      const { data, error } = await supabase
        .from('entity_profiles')
        .select('id, name, entity_type, description')
        .eq('entity_type', selectedType)
        .eq('is_claimed', false)
        .order('name')
        .limit(20);
      
      if (error) {
        console.error('Error fetching unclaimed profiles:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} unclaimed profiles for type ${selectedType}`);
      return data || [];
    },
    enabled: !!selectedType && isOpen,
  });

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

  const handleClaimProfile = async (profileId: string, profileName: string) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('entity_profiles')
        .update({ 
          is_claimed: true,
          owner_id: user.id 
        })
        .eq('id', profileId);

      if (error) throw error;

      // Log to Rocker
      await emitRockerEvent(
        'user.claim.profile',
        user.id,
        {
          entity_id: profileId,
          name: profileName,
        }
      );

      toast({
        title: 'Success',
        description: `Claimed ${profileName}`,
      });

      queryClient.invalidateQueries({ queryKey: ['user-entities'] });
      queryClient.invalidateQueries({ queryKey: ['unclaimed-profiles'] });
      navigate(`/entities/${profileId}`);
      handleClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to claim profile',
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

            {/* Create New Section */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="font-semibold text-sm">Create New</div>
                <div className="space-y-2">
                  <Input
                    placeholder={`Enter ${PROFILE_TYPES.find(t => t.type === selectedType)?.label.toLowerCase()} name`}
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    autoFocus
                  />
                  <Button
                    onClick={handleCreate}
                    disabled={isSubmitting || !profileName.trim()}
                    className="w-full"
                  >
                    {isSubmitting ? 'Creating...' : 'Create New Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Claim Existing Section */}
            {loadingUnclaimed ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Loading unclaimed profiles...
              </div>
            ) : unclaimedError ? (
              <Card className="border-destructive">
                <CardContent className="p-4">
                  <div className="text-sm text-destructive">
                    Error loading unclaimed profiles. Please try again.
                  </div>
                </CardContent>
              </Card>
            ) : unclaimedProfiles.length > 0 ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="font-semibold text-sm">
                    Claim Existing (Avoid Duplicates)
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {unclaimedProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{profile.name}</div>
                          {profile.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {profile.description}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="s"
                          onClick={() => handleClaimProfile(profile.id, profile.name)}
                          disabled={isSubmitting}
                          className="gap-2 ml-2 flex-shrink-0"
                        >
                          <CheckCircle size={16} />
                          Claim
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground text-center">
                    No unclaimed {PROFILE_TYPES.find(t => t.type === selectedType)?.label.toLowerCase()} profiles available
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              variant="ghost"
              onClick={() => setSelectedType(null)}
              className="w-full"
            >
              ← Back to Profile Types
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
