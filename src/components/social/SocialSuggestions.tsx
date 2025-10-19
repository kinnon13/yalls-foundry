/**
 * Social Suggestions - People, Creators, Businesses to follow
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, X, Building2, User, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  id: string;
  kind: 'friend' | 'creator' | 'business' | 'collab';
  subject_kind: 'user' | 'entity';
  subject_id: string;
  reason: string;
  overlap_score: number;
  features: {
    shared_interests?: string[];
    shared_cats?: string[];
    geo_km?: number;
  };
  status: string;
}

interface SocialSuggestionsProps {
  variant?: 'feed' | 'full';
  kind?: 'friend' | 'creator' | 'business' | 'collab';
  limit?: number;
}

export function SocialSuggestions({ variant = 'feed', kind, limit = 6 }: SocialSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestions();
  }, [kind]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('social_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'dismissed')
        .order('overlap_score', { ascending: false })
        .limit(limit);

      if (kind) {
        query = query.eq('kind', kind);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('[SocialSuggestions] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (suggestionId: string, action: 'follow' | 'dismiss') => {
    try {
      if (action === 'dismiss') {
        const { error } = await supabase
          .from('social_suggestions')
          .update({ status: 'dismissed' })
          .eq('id', suggestionId);

        if (error) throw error;

        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      } else {
        // TODO: Implement follow action
        const { error } = await supabase
          .from('social_suggestions')
          .update({ status: 'acted', acted_at: new Date().toISOString() })
          .eq('id', suggestionId);

        if (error) throw error;

        toast({
          title: 'Following',
          description: 'You\'re now following this person'
        });

        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      }

      // Emit telemetry
      await supabase.rpc('emit_signal', {
        p_name: action === 'follow' ? 'suggestion_acted' : 'suggestion_dismissed',
        p_metadata: { suggestion_id: suggestionId }
      });
    } catch (err) {
      console.error('[SocialSuggestions] Action error:', err);
      toast({
        title: 'Error',
        description: 'Failed to perform action',
        variant: 'destructive'
      });
    }
  };

  const getKindIcon = (k: string) => {
    switch (k) {
      case 'friend': return <User className="h-4 w-4" />;
      case 'creator': return <Users className="h-4 w-4" />;
      case 'business': return <Building2 className="h-4 w-4" />;
      case 'collab': return <UserPlus className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getKindLabel = (k: string) => {
    switch (k) {
      case 'friend': return 'Person';
      case 'creator': return 'Creator';
      case 'business': return 'Business';
      case 'collab': return 'Collab';
      default: return 'Person';
    }
  };

  if (suggestions.length === 0 && !loading) {
    return null;
  }

  const content = (
    <div className={variant === 'feed' ? 'space-y-3' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>{getKindIcon(suggestion.kind)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-sm">
                  {getKindLabel(suggestion.kind)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(suggestion.overlap_score * 100)}% match
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleAction(suggestion.id, 'dismiss')}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Shared interests */}
          {suggestion.features.shared_interests && suggestion.features.shared_interests.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1">Shared interests:</div>
              <div className="flex flex-wrap gap-1">
                {suggestion.features.shared_interests.slice(0, 3).map((interest, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {suggestion.features.shared_interests.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{suggestion.features.shared_interests.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Proximity */}
          {suggestion.features.geo_km !== undefined && (
            <div className="text-xs text-muted-foreground mb-3">
              {suggestion.features.geo_km < 1 ? 'Nearby' : `${Math.round(suggestion.features.geo_km)}km away`}
            </div>
          )}

          <Button
            size="sm"
            className="w-full"
            onClick={() => handleAction(suggestion.id, 'follow')}
          >
            <UserPlus className="h-3 w-3 mr-2" />
            Follow
          </Button>
        </Card>
      ))}
    </div>
  );

  if (variant === 'feed') {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4">
          {kind === 'friend' && 'People You May Know'}
          {kind === 'creator' && 'Creators to Follow'}
          {kind === 'business' && 'Businesses Near You'}
          {kind === 'collab' && 'Collaboration Picks'}
          {!kind && 'Suggested Connections'}
        </h3>
        {content}
      </Card>
    );
  }

  return content;
}
