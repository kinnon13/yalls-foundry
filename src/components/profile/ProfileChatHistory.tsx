/**
 * Profile Chat History Component
 * Shows user's saved chat conversations on their profile
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConversationSession {
  session_id: string;
  first_message: string;
  last_updated: string;
  message_count: number;
}

export function ProfileChatHistory() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rocker_conversations')
        .select('session_id, content, created_at')
        .eq('user_id', user.id)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by session
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
          if (new Date(msg.created_at) > new Date(session.last_updated)) {
            session.last_updated = msg.created_at;
          }
        }
      });

      setSessions(Array.from(sessionMap.values()));
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

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
    } catch (error) {
      toast.error('Failed to delete conversation');
      console.error(error);
    }
  }

  function handleOpenSession(sessionId: string) {
    // Store session ID in localStorage to be picked up by chat
    localStorage.setItem('rocker-load-session', sessionId);
    // Navigate to dashboard where chat can be opened
    navigate('/dashboard');
    // Wait a bit then dispatch custom event to open chat with this session
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('rocker-open-session', { 
        detail: { sessionId } 
      }));
    }, 100);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conversations yet. Start chatting with Rocker!</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.session_id}
                className={cn(
                  "group relative rounded-lg p-3 hover:bg-muted transition-colors cursor-pointer border"
                )}
                onClick={() => handleOpenSession(session.session_id)}
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
                    onClick={(e) => deleteSession(session.session_id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {sessions.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                Showing 5 most recent. Open chat for full history.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
