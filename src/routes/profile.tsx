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
import { mockProfileService } from '@/lib/profiles/service.mock';
import { useSession } from '@/lib/auth/context';
import type { AnyProfile } from '@/lib/profiles/types';
import { ArrowLeft, User } from 'lucide-react';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AnyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no ID provided, show current user's profile
    if (!id && session?.userId) {
      setLoading(true);
      // For now, create a basic user profile view
      setProfile({
        id: session.userId,
        type: 'rider',
        name: session.email || 'User',
        is_claimed: true,
        claimed_by: session.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as AnyProfile);
      setLoading(false);
      return;
    }

    if (!id) return;

    setLoading(true);
    mockProfileService.getById(id).then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [id, session]);

  const handleClaim = async () => {
    if (!profile || !session?.userId) return;

    const updated = await mockProfileService.claim(profile.id, session.userId);
    if (updated) {
      setProfile(updated);
    }
  };

  const handleEdit = () => {
    alert('Edit functionality coming soon');
  };

  const handleDelete = async () => {
    if (!profile) return;
    if (!confirm(`Delete profile "${profile.name}"?`)) return;

    const success = await mockProfileService.delete(profile.id);
    if (success) {
      window.location.href = '/';
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
                  <Button variant="outline" onClick={handleEdit}>Edit Profile</Button>
                  <Button variant="outline" onClick={() => navigate('/posts/saved')}>Saved Posts</Button>
                  <Button variant="outline" onClick={() => navigate('/mlm/dashboard')}>My Network</Button>
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
