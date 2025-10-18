/**
 * ConversationList - iMessage-style conversation list
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  type: string;
  last_message_at: string | null;
  last_message?: {
    body: string;
    sender_id: string;
  };
  participants: Array<{
    user_id: string;
    full_name?: string;
  }>;
  unread_count: number;
}

interface ConversationListProps {
  onSelect: (conversationId: string) => void;
  selectedId?: string;
}

export function ConversationList({ onSelect, selectedId }: ConversationListProps) {
  const [search, setSearch] = useState('');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return [];

      const { data: convos } = await supabase
        .from('conversations' as any)
        .select(`
          id,
          type,
          last_message_at,
          conversation_members!inner(user_id, profiles:user_id(display_name, avatar_url))
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(50);

      if (!convos) return [];

      return convos.map((c: any) => {
        const members = c.conversation_members || [];
        const otherMembers = members.filter((m: any) => m.user_id !== session.session?.user.id);
        
        return {
          id: c.id,
          type: c.type,
          last_message_at: c.last_message_at,
          last_message: undefined,
          participants: otherMembers.map((m: any) => ({
            user_id: m.user_id,
            full_name: m.profiles?.display_name || 'Unknown'
          })),
          unread_count: 0,
        };
      });
    },
  });

  const filteredConvos = conversations?.filter(c =>
    search ? c.participants.some(p => 
      p.full_name?.toLowerCase().includes(search.toLowerCase())
    ) : true
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r border-border/40 bg-muted/20">
      {/* Search */}
      <div className="p-3 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-border/30 h-8 text-[13px]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConvos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Start a new conversation to get started</p>
          </div>
        ) : (
          filteredConvos.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/40 transition-colors text-left border-b border-border/20",
                selectedId === conversation.id && "bg-muted/60"
              )}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-primary">
                  {conversation.participants[0]?.full_name?.[0] || '?'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-foreground truncate">
                    {conversation.participants
                      .filter(p => p.user_id !== (supabase.auth.getUser as any)()?.id)
                      .map(p => p.full_name || 'Unknown')
                      .join(', ') || 'Conversation'}
                  </span>
                  {conversation.last_message_at && (
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground truncate">
                  {conversation.last_message?.body || 'No messages yet'}
                </p>
              </div>

              {/* Unread badge */}
              {conversation.unread_count > 0 && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-primary-foreground">
                    {conversation.unread_count}
                  </span>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
