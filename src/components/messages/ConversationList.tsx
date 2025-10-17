/**
 * Conversation List - Left sidebar with search & conversations
 */

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type Conversation = {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_online: boolean;
};

type ConversationListProps = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewMessage: () => void;
};

export function ConversationList({ selectedId, onSelect, onNewMessage }: ConversationListProps) {
  const session = useSession();
  const [search, setSearch] = useState('');

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations', session?.session?.userId],
    enabled: !!session?.session?.userId,
    refetchInterval: 5000, // Poll every 5s for new messages
    queryFn: async () => {
      // Get all conversations where user is sender or recipient
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_user_id, recipient_user_id, body, created_at, read_at')
        .or(`sender_user_id.eq.${session!.session!.userId},recipient_user_id.eq.${session!.session!.userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner & fetch profiles
      const convMap = new Map<string, Conversation>();
      const otherUserIds = new Set<string>();
      
      data?.forEach((msg: any) => {
        const isFromMe = msg.sender_user_id === session!.session!.userId;
        const otherId = isFromMe ? msg.recipient_user_id : msg.sender_user_id;
        otherUserIds.add(otherId);

        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            id: otherId,
            other_user_id: otherId,
            other_user_name: 'Loading...',
            other_user_avatar: null,
            last_message: msg.body.substring(0, 60),
            last_message_at: msg.created_at,
            unread_count: 0,
            is_online: false
          });
        }

        // Count unread (messages TO me that aren't read)
        if (!isFromMe && !msg.read_at) {
          const conv = convMap.get(otherId)!;
          conv.unread_count++;
        }
      });

      // Fetch profiles for all conversation partners
      if (otherUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', Array.from(otherUserIds));

        profiles?.forEach(prof => {
          const conv = convMap.get(prof.user_id);
          if (conv) {
            conv.other_user_name = prof.display_name || 'Unknown';
            conv.other_user_avatar = prof.avatar_url;
          }
        });
      }

      return Array.from(convMap.values());
    }
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!session?.session?.userId) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_user_id=eq.${session.session.userId}`
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.session?.userId, refetch]);

  const filtered = conversations?.filter(c =>
    c.other_user_name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Messages</CardTitle>
          <Button size="sm" onClick={onNewMessage}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-muted-foreground">
              {search ? 'No conversations found' : 'No messages yet'}
            </p>
            <Button variant="link" onClick={onNewMessage} className="mt-2">
              Start a conversation
            </Button>
          </div>
        ) : (
          <div className="space-y-px">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.other_user_id)}
                className={cn(
                  'w-full p-4 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left',
                  selectedId === conv.other_user_id && 'bg-accent'
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.other_user_avatar || undefined} />
                    <AvatarFallback>{conv.other_user_name[0]}</AvatarFallback>
                  </Avatar>
                  {conv.is_online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <p className="font-semibold truncate">{conv.other_user_name}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.last_message}
                    </p>
                    {conv.unread_count > 0 && (
                      <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
