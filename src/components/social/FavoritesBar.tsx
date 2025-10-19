import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

type EntityKind = 'person' | 'business' | 'horse' | 'event';

type Bubble = {
  id: string;
  display_name: string;
  handle?: string | null;
  kind: string;
  status?: string | null;
  avatar_url?: string | null;
  is_mock?: boolean;
};

function ringColor(kind: string) {
  switch (kind) {
    case 'person': return 'hsl(258 85% 60%)';
    case 'horse': return 'hsl(160 65% 50%)';
    case 'business': return 'hsl(200 90% 55%)';
    case 'event': return 'hsl(45 85% 55%)';
    case 'ai': return 'hsl(210 100% 60%)'; // Blue for AI
    default: return 'hsl(200 90% 55%)';
  }
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatBubble(e: any): Bubble {
  // Extract avatar from metadata (could be avatar_url or logo_url)
  let avatarUrl = null;
  if (e.metadata) {
    if (typeof e.metadata === 'string') {
      try {
        const parsed = JSON.parse(e.metadata);
        avatarUrl = parsed.avatar_url || parsed.logo_url || null;
      } catch {
        // If parsing fails, use the object directly
        avatarUrl = e.metadata.avatar_url || e.metadata.logo_url || null;
      }
    } else {
      avatarUrl = e.metadata.avatar_url || e.metadata.logo_url || null;
    }
  }
  
  return {
    id: e.id,
    display_name: e.display_name,
    handle: e.handle,
    kind: e.kind,
    status: e.status,
    avatar_url: avatarUrl,
    is_mock: e.is_mock || false,
  };
}

/** Query: pinned entities (favorites) for the rail */
function useFavoriteBubbles(userId: string | null, { publicOnly = false }: { publicOnly?: boolean } = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['favorite-bubbles', userId, publicOnly];

  // Setup realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('user_pins_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_pins',
          filter: `user_id=eq.${userId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, queryKey]);

  return useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [] as Bubble[];

      let q = supabase
        .from('user_pins')
        .select('ref_id, sort_index, is_public')
        .eq('user_id', userId)
        .eq('pin_type', 'entity')
        .in('section', ['home', 'dashboard'])
        .order('sort_index', { ascending: true });

      if (publicOnly) q = q.eq('is_public', true);

      const { data: pins, error } = await q;
      if (error || !pins?.length) return [] as Bubble[];

      const ids = pins.map(p => p.ref_id);
      const { data: ents } = await supabase
        .from('entities')
        .select('id, display_name, handle, kind, status, metadata, is_mock')
        .in('id', ids.map(id => id as any));

      const map = new Map(ents?.map(e => [e.id, e]) ?? []);
      return pins
        .map(p => map.get(p.ref_id as any))
        .filter(Boolean)
        .map(formatBubble) as Bubble[];
    }
  });
}

/** Mutations: add/remove pin */
function useFavoriteMutations(userId: string | null) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const add = useMutation({
    mutationFn: async (entityId: string) => {
      if (!userId) throw new Error('Not signed in');
      
      console.log('Adding favorite:', { userId, entityId });
      
      // get next sort_index
      const { data: existing } = await supabase
        .from('user_pins')
        .select('sort_index')
        .eq('user_id', userId)
        .eq('pin_type', 'entity')
        .eq('section', 'home')
        .order('sort_index', { ascending: false })
        .limit(1);

      const nextIndex = (existing?.[0]?.sort_index ?? -1) + 1;
      
      console.log('Next sort index:', nextIndex);

      const { error } = await supabase
        .from('user_pins')
        .upsert({
          user_id: userId,
          pin_type: 'entity',
          ref_id: entityId,
          section: 'home',
          sort_index: nextIndex,
          is_public: true,
        }, { onConflict: 'user_id,pin_type,ref_id,section' });

      if (error) {
        console.error('Error adding favorite:', error);
        throw error;
      }
      
      console.log('Favorite added successfully');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorite-bubbles', userId] });
      toast({
        title: "Added to favorites",
        description: "Profile added to your favorites bar",
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Failed to add favorite",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const remove = useMutation({
    mutationFn: async (entityId: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('user_pins')
        .delete()
        .match({ user_id: userId, pin_type: 'entity', ref_id: entityId, section: 'home' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorite-bubbles', userId] });
      toast({
        title: "Removed from favorites",
        description: "Profile removed from your favorites bar",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove favorite",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return { add, remove };
}

/** Search sheet for adding favorites */
function AddFavoritesSheet({
  open, onClose, onPick,
}: { open: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<EntityKind | 'all'>('all');

  const { data, isFetching } = useQuery({
    queryKey: ['search-entities', q, kind],
    enabled: open,
    queryFn: async () => {
      let sel = supabase
        .from('entities')
        .select('id, display_name, handle, kind, metadata, status, is_mock')
        .in('status', ['claimed', 'verified', 'unclaimed'])
        .order('created_at', { ascending: false })
        .limit(30);

      if (q) {
        sel = sel.ilike('display_name', `%${q}%`);
      }
      if (kind !== 'all' && ['person', 'business', 'horse', 'event'].includes(kind)) {
        sel = sel.eq('kind', kind);
      }
      const { data } = await sel;
      return (data ?? []).map(formatBubble) as Bubble[];
    }
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-[80] flex items-end sm:items-center justify-center transition-opacity duration-200",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-xl p-4 sm:p-5 m-0 sm:m-6">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 opacity-70" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search profiles to favorite…"
            className="w-full bg-transparent outline-none text-base"
          />
          <button onClick={onClose} className="p-2 rounded-md hover:bg-accent/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(['all','person','business','horse','event'] as const).map(k => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "px-3 py-1 rounded-full border shrink-0 text-sm",
                kind === k ? "bg-primary text-primary-foreground border-primary" : "border-border"
              )}
            >
              {k === 'horse' ? 'Horses' : k === 'person' ? 'People' : k[0].toUpperCase()+k.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-3 max-h-[60vh] overflow-y-auto divide-y divide-border/60">
          {isFetching && <div className="p-4 text-sm opacity-70">Searching…</div>}
          {(data ?? []).map(item => (
            <button
              key={item.id}
              onClick={() => { onPick(item.id); }}
              className="w-full flex items-center gap-3 p-3 hover:bg-accent/40 text-left transition-colors"
            >
              <div
                className="w-10 h-10 rounded-full grid place-items-center overflow-hidden shrink-0"
                style={{ border: `2px solid ${ringColor(item.kind)}` }}
              >
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt={item.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-medium">{initials(item.display_name)}</span>
                )}
                {item.is_mock && (
                  <div className="absolute top-0 left-0 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-black">M</span>
                  </div>
                )}
              </div>
              <div className="grow min-w-0">
                <div className="font-medium leading-tight truncate">{item.display_name}</div>
                <div className="text-xs opacity-70 truncate">
                  {item.handle ? `@${item.handle}` : item.kind}
                </div>
              </div>
              <div className="shrink-0">
                <Check className="w-5 h-5 opacity-70" />
              </div>
            </button>
          ))}
          {!isFetching && (data ?? []).length === 0 && (
            <div className="p-6 text-sm opacity-70 text-center">No results. Try another name or type.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** The always-on favorites rail with trailing + bubble */
export function FavoritesBar({
  publicOnly = false,
  size = 72,
  gap = 12,
  className,
  userId: propUserId,
}: {
  publicOnly?: boolean;
  size?: number;
  gap?: number;
  className?: string;
  userId?: string | null;
}) {
  const { session } = useSession();
  const sessionUserId = session?.userId ?? null;
  const userId = propUserId ?? sessionUserId;
  const navigate = useNavigate();

  const { data: realBubbles = [], isLoading } = useFavoriteBubbles(userId, { publicOnly });
  const { add, remove } = useFavoriteMutations(userId);

  // Ensure Rocker is always first and pinned
  const ROCKER_ID = '00000000-0000-0000-0000-000000000001';
  const rockerBubble = realBubbles.find(b => b.id === ROCKER_ID);
  const otherBubbles = realBubbles.filter(b => b.id !== ROCKER_ID);
  
  // Put Rocker first, then the rest
  const bubbles = rockerBubble ? [rockerBubble, ...otherBubbles] : realBubbles;

  const [sheetOpen, setSheetOpen] = useState(false);

  const handlePick = async (id: string) => {
    try {
      await add.mutateAsync(id);
      setSheetOpen(false);
    } catch (error) {
      console.error('Failed to add favorite:', error);
      // Sheet stays open so user can try again
    }
  };

  const handleBubbleClick = (id: string, kind: string) => {
    // For person/AI profiles, navigate to their profile in the social feed
    if (kind === 'person' || kind === 'ai') {
      window.dispatchEvent(new CustomEvent('view-profile', { detail: { userId: id } }));
    } else {
      // For other entities, navigate to entity page
      navigate(`/entities/${id}`);
    }
  };

  return (
    <div className={cn("w-full overflow-x-auto no-scrollbar", className)}>
      <div
        className="flex items-center"
        style={{ gap }}
        aria-label="Favorites"
        role="listbox"
      >
        {/* When empty: show a soft skeleton rail */}
        {(!bubbles.length && !isLoading) && (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`ghost-${i}`}
                className="rounded-full bg-muted/50 border border-border/60 shrink-0"
                style={{ width: size, height: size }}
                aria-hidden
              />
            ))}
          </>
        )}

        {/* Real bubbles - Keep as circles */}
        {bubbles.map((b) => {
          const isRocker = b.id === ROCKER_ID;
          const isAI = isRocker || b.kind === 'ai';
          return (
            <button
              key={b.id}
              role="option"
              aria-label={`Open ${b.display_name}`}
              className="relative group shrink-0 hover:scale-105 active:scale-95 transition-transform"
              title={b.display_name}
              onClick={() => handleBubbleClick(b.id, b.kind)}
              onContextMenu={(e) => {
                e.preventDefault();
                // Don't allow removing Rocker
                if (!isRocker) {
                  remove.mutate(b.id);
                }
              }}
            >
              <div
                className={cn(
                  "rounded-full overflow-hidden grid place-items-center",
                  isAI && !b.avatar_url ? "bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400" : "bg-gradient-to-br from-background to-muted"
                )}
                style={{
                  width: size,
                  height: size,
                  border: `2px solid ${ringColor(isAI ? 'ai' : b.kind)}`
                }}
              >
                {b.avatar_url ? (
                  <img src={b.avatar_url} alt={b.display_name} className="w-full h-full object-cover" />
                ) : isAI ? (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{initials(b.display_name)}</span>
                )}
                {b.is_mock && (
                  <div className="absolute top-0 left-0 w-5 h-5 bg-yellow-500 rounded-full border-2 border-background flex items-center justify-center">
                    <span className="text-[10px] font-bold text-black">M</span>
                  </div>
                )}
              </div>
              {isRocker && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full border-2 border-background animate-pulse" title="AI Assistant" />
              )}
            </button>
          );
        })}

        {/* Trailing + bubble — ALWAYS visible */}
        {!publicOnly && (
          <button
            onClick={() => setSheetOpen(true)}
            className="grid place-items-center border border-dashed hover:border-solid hover:bg-accent/30 transition-all shrink-0"
            aria-label="Add favorite"
            title="Add favorite"
            style={{ width: size, height: size, borderRadius: '9999px' }}
          >
            <Plus className="w-6 h-6 opacity-80" />
          </button>
        )}
      </div>

      {/* Add sheet */}
      {!publicOnly && (
        <AddFavoritesSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onPick={handlePick}
        />
      )}
    </div>
  );
}

/** Use this on a public profile page to show public favorites only */
export function PublicFavoritesBar({ profileUserId }: { profileUserId: string }) {
  return <FavoritesBar publicOnly userId={profileUserId} size={64} gap={10} className="py-2" />;
}
