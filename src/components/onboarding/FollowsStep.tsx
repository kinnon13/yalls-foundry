/**
 * Step 5: Follow Suggestions
 * Seed follows based on interests
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, UserPlus } from 'lucide-react';

interface FollowsStepProps {
  onComplete: () => void;
  onBack: () => void;
}

interface SuggestedUser {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function FollowsStep({ onComplete, onBack }: FollowsStepProps) {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's interests
      const { data: profile } = await supabase
        .from('profiles')
        .select('interests')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get suggested users (top 8, exclude self)
      const { data: users } = await supabase
        .from('profiles')
        .select('user_id, handle, display_name, avatar_url')
        .neq('user_id', user.id)
        .not('handle', 'is', null)
        .limit(8);

      if (users) {
        setSuggestions(users.map(u => ({
          id: u.user_id,
          handle: u.handle,
          display_name: u.display_name,
          avatar_url: u.avatar_url
        })));
      }
    } catch (err) {
      console.error('[FollowsStep] Load suggestions error:', err);
    }
  };

  const toggleUser = (userId: string) => {
    setSelected(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (selected.length > 0) {
        // Batch insert follows
        const follows = selected.map(followeeId => ({
          follower_user_id: user.id,
          followee_user_id: followeeId
        }));

        const { error } = await supabase
          .from('follows')
          .upsert(follows, { onConflict: 'follower_user_id,followee_user_id' });

        if (error) throw error;
      }

      onComplete();
    } catch (err) {
      console.error('[FollowsStep] Save error:', err);
      alert('Failed to save follows');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Follow Suggested Users</h2>
        <p className="text-muted-foreground">
          Start building your network - you can always follow more later
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No suggestions available yet</p>
          <p className="text-sm">You can find people to follow after completing setup</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {suggestions.map((user) => (
            <div
              key={user.id}
              onClick={() => toggleUser(user.id)}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selected.includes(user.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <Checkbox
                checked={selected.includes(user.id)}
                onCheckedChange={() => toggleUser(user.id)}
              />
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {user.display_name?.[0] || user.handle?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {user.display_name || user.handle}
                </div>
                {user.handle && user.display_name && (
                  <div className="text-sm text-muted-foreground">@{user.handle}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {selected.length === 0 ? (
          <Button onClick={handleSkip} variant="outline" className="flex-1">
            Skip for Now
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : `Follow ${selected.length} ${selected.length === 1 ? 'User' : 'Users'}`}
          </Button>
        )}
      </div>
    </div>
  );
}
