/**
 * Dynamic Profile Page (<200 LOC)
 * Bubbles + Link Bars + Aggregated/Entity Counts + Tabs
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { ProfileBubbles } from '@/components/profile/ProfileBubbles';
import { ProfileLinkBars } from '@/components/profile/ProfileLinkBars';
import { ProfileCounts } from '@/components/profile/ProfileCounts';
import { AppearanceSheet } from '@/components/profile/AppearanceSheet';
import { ProfileFeedTab } from '@/components/profile/ProfileFeedTab';
import { PublicAppPack } from '@/components/profile/PublicAppPack';
import { ConnectionActions } from '@/components/profile/ConnectionActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { id } = useParams();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-detail', id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If no ID, show current user profile
      if (!id && user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        return {
          ...userProfile,
          isUserProfile: true,
          isOwner: true
        };
      }

      // Otherwise load by profile ID
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      return {
        ...data,
        isUserProfile: true,
        isOwner: user?.id === data?.user_id
      };
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          Profile not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-20 h-20 rounded-full"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">{profile.display_name}</h1>
              </div>
            </div>

            {profile.isOwner && <AppearanceSheet />}
          </div>

          {profile.bio && (
            <p className="text-muted-foreground mb-4">{profile.bio}</p>
          )}

          {/* Counts */}
          <ProfileCounts
            userId={profile.user_id}
            isUserProfile={profile.isUserProfile}
          />
        </div>

        {/* Bubbles */}
        {profile.isOwner && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
            <ProfileBubbles profileId={profile.id} />
          </div>
        )}

        {/* Link Bars */}
        <div className="mb-8">
          <ProfileLinkBars userId={profile.user_id} />
        </div>

        {/* Public App Pack */}
        <div className="mb-8">
          <PublicAppPack 
            entityId={profile.id} 
            entityName={profile.display_name || 'User'}
            entityType="user"
          />
        </div>

        {/* Connection Actions */}
        {!profile.isOwner && (
          <div className="mb-8">
            <ConnectionActions 
              entityId={profile.id}
              entityName={profile.display_name || 'User'}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="this-page">
          <TabsList>
            <TabsTrigger value="this-page">This Page</TabsTrigger>
            <TabsTrigger value="combined">Combined</TabsTrigger>
          </TabsList>

          <TabsContent value="this-page">
            <ProfileFeedTab entityId={profile.user_id} mode="this_page" />
          </TabsContent>

          <TabsContent value="combined">
            <ProfileFeedTab entityId={profile.user_id} mode="combined" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
