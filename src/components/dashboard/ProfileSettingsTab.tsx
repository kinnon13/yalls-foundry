/**
 * Profile Settings Tab
 * 
 * Allows users to view and edit their basic profile information
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { toast } from 'sonner';
import { User, Save } from 'lucide-react';
import { AvatarUploader } from '@/components/profile/AvatarUploader';

export function ProfileSettingsTab() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', session?.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session?.userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!session?.userId,
  });

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Sync form state with profile data when it loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: { display_name?: string; bio?: string; avatar_url?: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session?.userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', session?.userId] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    },
  });

  const handleSave = () => {
    // Also invalidate the currentProfile query used by the header
    queryClient.invalidateQueries({ queryKey: ['currentProfile'] });
    
    updateMutation.mutate({
      display_name: displayName || undefined,
      bio: bio || undefined,
      avatar_url: avatarUrl || undefined,
    });
  };

  const handleCancel = () => {
    setDisplayName(profile?.display_name || '');
    setBio(profile?.bio || '');
    setAvatarUrl(profile?.avatar_url || '');
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>
            Manage your public profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={isEditing ? displayName : (profile?.display_name || 'Not set')}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!isEditing}
              placeholder="Your display name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={isEditing ? bio : (profile?.bio || 'No bio yet')}
              onChange={(e) => setBio(e.target.value)}
              disabled={!isEditing}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          {/* Avatar Photo Upload */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            {isEditing ? (
              <AvatarUploader
                currentUrl={avatarUrl}
                onUploadComplete={(url) => setAvatarUrl(url)}
              />
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {profile?.avatar_url ? 'Photo set' : 'No photo uploaded'}
                </span>
              </div>
            )}
          </div>

          {/* User Info (Read-only) */}
          <div className="pt-4 border-t space-y-2">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-sm">{session?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">User ID</Label>
              <p className="text-xs font-mono">{session?.userId}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
