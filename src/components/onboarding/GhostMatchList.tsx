import { useState, useEffect, useRef } from 'react';
import { Building2, Globe, Phone, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface GhostMatch {
  entity_id: string;
  name: string;
  website: string | null;
  phone: string | null;
  score: number;
  reason: string;
}

interface GhostMatchListProps {
  name: string;
  phone?: string;
  website?: string;
  onClaim: (entityId: string, entityName: string) => void;
  claimedId: string | null;
}

export function GhostMatchList({ name, phone, website, onClaim, claimedId }: GhostMatchListProps) {
  const [matches, setMatches] = useState<GhostMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!name || name.length < 3) {
      setMatches([]);
      return;
    }

    setLoading(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('ghost_match' as any, {
          p_name: name.trim(),
          p_phone: phone || null,
          p_site: website || null,
          p_limit: 5
        }) as { data: GhostMatch[] | null; error: any };

        if (error) throw error;
        setMatches(data || []);
      } catch (err) {
        console.error('Ghost match failed:', err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [name, phone, website]);

  if (!name || name.length < 3) return null;
  if (loading) return null;
  if (matches.length === 0) return null;

  const reasonIcon = (reason: string) => {
    switch (reason) {
      case 'phone': return <Phone className="h-3 w-3" />;
      case 'website': return <Globe className="h-3 w-3" />;
      default: return <Building2 className="h-3 w-3" />;
    }
  };

  const reasonLabel = (reason: string) => {
    switch (reason) {
      case 'phone': return 'Phone match';
      case 'website': return 'Website match';
      default: return 'Name match';
    }
  };

  return (
    <div className="mt-3 p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
        <AlertCircle className="h-4 w-4 text-primary" />
        <span>Found possible matches</span>
      </div>
      <div className="space-y-2">
        {matches.map((match) => (
          <div
            key={match.entity_id}
            className={`p-2 rounded-md border transition-all ${
              claimedId === match.entity_id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:bg-accent/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{match.name}</div>
                {match.website && (
                  <div className="text-xs text-muted-foreground truncate">{match.website}</div>
                )}
                {match.phone && (
                  <div className="text-xs text-muted-foreground">{match.phone}</div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                    {reasonIcon(match.reason)}
                    {reasonLabel(match.reason)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(match.score * 100)}% match
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={claimedId === match.entity_id ? 'default' : 'outline'}
                onClick={() => onClaim(match.entity_id, match.name)}
              >
                {claimedId === match.entity_id ? 'Claimed' : 'Claim'}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        You can claim an existing business and verify ownership later.
      </p>
    </div>
  );
}
