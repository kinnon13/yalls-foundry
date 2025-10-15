import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConversationSession {
  id: string;
  session_id: string;
  title: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

interface ConversationSidebarProps {
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({ 
  currentSessionId, 
  onSelectSession, 
  onNewConversation 
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Delete session metadata
      const { error: metaError } = await supabase
        .from('conversation_sessions')
        .delete()
        .eq('session_id', sessionId);

      if (metaError) throw metaError;

      // Delete messages
      const { error: msgError } = await supabase
        .from('rocker_conversations')
        .delete()
        .eq('session_id', sessionId);

      if (msgError) throw msgError;

      toast({
        title: 'Conversation deleted',
        description: 'The conversation has been permanently deleted.',
      });

      loadConversations();
      
      // If deleted current conversation, start new one
      if (sessionId === currentSessionId) {
        onNewConversation();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadConversations();

    // Subscribe to changes in DB (realtime)
    const channel = supabase
      .channel('conversation_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_sessions',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    // Also refresh when a session is created/loaded via UI events (fallback if realtime isn't active)
    const refresh = () => loadConversations();
    window.addEventListener('rocker-load-session' as any, refresh);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('rocker-load-session' as any, refresh);
    };
  }, []);

  return (
    <div className="flex flex-col h-full border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-4 border-b">
        <Button 
          onClick={onNewConversation}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                  currentSessionId === conv.session_id ? 'bg-accent' : ''
                }`}
                onClick={() => onSelectSession(conv.session_id)}
              >
                <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {conv.title || 'Untitled conversation'}
                  </div>
                  {conv.summary && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.summary}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => deleteConversation(conv.session_id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
