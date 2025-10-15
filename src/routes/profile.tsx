/**
 * Profile Route
 * 
 * Unified profile view for all profile types.
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileFields } from '@/components/profile/ProfileFields';
import { ClaimBanner } from '@/components/profile/ClaimBanner';
import { ProfileActions } from '@/components/profile/ProfileActions';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import type { AnyProfile } from '@/lib/profiles/types';
import { ArrowLeft, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AnyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      // If no ID provided, show current user's profile info
      if (!id && session?.userId) {
        setLoading(true);
        // Fetch user's claimed entity profiles
        const { data } = await supabase
          .from('entity_profiles')
          .select('*')
          .eq('owner_id', session.userId)
          .limit(1)
          .maybeSingle();

        if (data) {
          setProfile({
            ...data,
            type: data.entity_type,
            custom_fields: data.custom_fields || {},
          } as AnyProfile);
        } else {
          // Show basic user info if no entity profiles
          setProfile({
            id: session.userId,
            type: 'rider',
            name: session.email || 'User',
            is_claimed: true,
            claimed_by: session.userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            custom_fields: {},
          } as AnyProfile);
        }
        setLoading(false);
        return;
      }

      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('entity_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
        setProfile(null);
      } else {
        setProfile({
          ...data,
          type: data.entity_type,
          custom_fields: data.custom_fields || {},
        } as AnyProfile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [id, session]);

  const handleClaim = async () => {
    if (!profile || !session?.userId) return;

    const { data, error } = await supabase
      .from('entity_profiles')
      .update({
        is_claimed: true,
        claimed_by: session.userId,
        owner_id: session.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to claim profile');
      console.error(error);
    } else {
      setProfile({
        ...data,
        type: data.entity_type,
        custom_fields: data.custom_fields || {},
      } as AnyProfile);
      toast.success('Profile claimed successfully!');
    }
  };

  const handleEdit = () => {
    alert('Edit functionality coming soon');
  };

  const handleDelete = async () => {
    if (!profile) return;
    if (!confirm(`Delete profile "${profile.name}"?`)) return;

    const { error } = await supabase
      .from('entity_profiles')
      .delete()
      .eq('id', profile.id);

    if (error) {
      toast.error('Failed to delete profile');
      console.error(error);
    } else {
      toast.success('Profile deleted successfully');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Profile not found</p>
            <Link to="/">
              <Button variant="link" className="mt-2">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet title={profile.name} description={`Profile for ${profile.name}`} />
      <GlobalHeader />
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {!id && session && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  My Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{session.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{session.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs">{session.userId}</p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => navigate('/dashboard')} data-rocker="dashboard profile button" aria-label="Go to Dashboard">Go to Dashboard</Button>
                  <Button variant="outline" onClick={() => navigate('/calendar')} data-rocker="calendar profile button" aria-label="My Calendar">
                    <Calendar className="h-4 w-4 mr-2" />
                    My Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {id && (
            <>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>

              <ClaimBanner isClaimed={profile.is_claimed} onClaim={handleClaim} />

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <ProfileHeader profile={profile} />
                    <ProfileActions onEdit={handleEdit} onDelete={handleDelete} />
                  </div>
                </CardHeader>
                <CardContent>
                  <ProfileFields profile={profile} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
