/**
 * Conversation History Sidebar
 * Shows saved chat sessions like ChatGPT
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConversationSession {
  session_id: string;
  first_message: string;
  last_updated: string;
  message_count: number;
}

interface ConversationHistoryProps {
  onLoadSession: (sessionId: string) => void;
  onNewChat: () => void;
  currentSessionId?: string;
}

export function ConversationHistory({ onLoadSession, onNewChat, currentSessionId }: ConversationHistoryProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all unique sessions with their first message and count
      const { data, error } = await supabase
        .from('rocker_conversations')
        .select('session_id, content, created_at')
        .eq('user_id', user.id)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by session and get first message + count
      const sessionMap = new Map<string, ConversationSession>();
      data?.forEach((msg: any) => {
        if (!sessionMap.has(msg.session_id)) {
          sessionMap.set(msg.session_id, {
            session_id: msg.session_id,
            first_message: msg.content,
            last_updated: msg.created_at,
            message_count: 1
          });
        } else {
          const session = sessionMap.get(msg.session_id)!;
          session.message_count++;
          // Update to latest timestamp
          if (new Date(msg.created_at) > new Date(session.last_updated)) {
            session.last_updated = msg.created_at;
          }
        }
      });

      setSessions(Array.from(sessionMap.values()));
    } catch (error) {
      // Silent fail - not critical to user flow
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(sessionId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('rocker_conversations')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      toast.success('Conversation deleted');

      // If deleted current session, start new chat
      if (sessionId === currentSessionId) {
        onNewChat();
      }
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r border-border">
      <div className="p-4 border-b border-border">
        <Button 
          onClick={onNewChat} 
          className="w-full justify-start"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        {loading ? (
          <p className="text-sm text-center text-muted-foreground py-4">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-4">No saved chats yet</p>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className={cn(
                  "group relative rounded-lg p-3 hover:bg-muted transition-colors cursor-pointer",
                  currentSessionId === session.session_id && "bg-muted"
                )}
                onClick={() => onLoadSession(session.session_id)}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2 mb-1">
                      {session.first_message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(session.last_updated)}</span>
                      <span>• {session.message_count} msgs</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.session_id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
