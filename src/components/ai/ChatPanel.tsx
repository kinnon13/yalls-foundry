/**
 * Chat Panel - Text + Voice conversations
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Clock, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ConversationSession {
  session_id: string;
  title: string;
  summary: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface Message {
  role: string;
  content: string;
  created_at: string;
}

export function ChatPanel() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession);
    }
  }, [selectedSession]);

  async function loadSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessionsData, error } = await supabase
        .from('conversation_sessions')
        .select('session_id, title, summary, updated_at, created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (sessionsData && sessionsData.length > 0) {
        const sessionIds = sessionsData.map((row: any) => row.session_id);
        const { data: msgs } = await supabase
          .from('rocker_conversations')
          .select('session_id')
          .eq('user_id', user.id)
          .in('session_id', sessionIds);
        
        const counts = new Map<string, number>();
        (msgs || []).forEach((m: any) => {
          counts.set(m.session_id, (counts.get(m.session_id) || 0) + 1);
        });

        const items = sessionsData.map((row: any) => ({
          session_id: row.session_id,
          title: row.title || 'Untitled Conversation',
          summary: row.summary || '',
          created_at: row.created_at,
          updated_at: row.updated_at,
          message_count: counts.get(row.session_id) || 0,
        }));

        setSessions(items);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(sessionId: string) {
    setLoadingMessages(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rocker_conversations')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load conversation');
    } finally {
      setLoadingMessages(false);
    }
  }

  async function deleteSession(sessionId: string) {
    if (!confirm('Delete this conversation?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('rocker_conversations').delete().eq('session_id', sessionId).eq('user_id', user.id);
      await supabase.from('conversation_sessions').delete().eq('session_id', sessionId).eq('user_id', user.id);

      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function formatTimestamp(dateString: string) {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
      {/* Left: Conversations List */}
      <Card className="col-span-3 bg-card/50">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>{sessions.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-320px)]">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className={cn(
                      "group p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                      selectedSession === session.session_id && "bg-accent border-primary"
                    )}
                    onClick={() => setSelectedSession(session.session_id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{session.title}</p>
                        {session.summary && (
                          <p className="text-xs text-muted-foreground truncate mt-1">{session.summary}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(session.updated_at)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
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
        </CardContent>
      </Card>

      {/* Center: Chat View */}
      <Card className="col-span-6 bg-card/50">
        <CardHeader>
          <CardTitle>
            {selectedSession 
              ? sessions.find(s => s.session_id === selectedSession)?.title || 'Conversation'
              : 'Select a conversation'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedSession ? (
            <div className="flex items-center justify-center h-[calc(100vh-320px)] text-center">
              <div>
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Select a conversation</p>
              </div>
            </div>
          ) : loadingMessages ? (
            <div className="flex items-center justify-center h-[calc(100vh-320px)]">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-4 pr-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={new URL('@/assets/rocker-cowboy-avatar.jpeg', import.meta.url).href} />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-4 py-2",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {formatTimestamp(message.created_at)}
                      </span>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Right: Context */}
      <Card className="col-span-3 bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm">Quick Context</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Memories and facts used in this conversation will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
