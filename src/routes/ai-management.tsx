/**
 * AI Management Dashboard
 * Full-featured interface for managing chat history, memories, and AI settings
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Clock, Trash2, User, Brain, Settings } from 'lucide-react';
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

export default function AIManagement() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  useEffect(() => {
    loadSessions();
    loadMemories();
    
    // Check if a session was selected from profile
    const preloadSession = localStorage.getItem('rocker-load-session');
    if (preloadSession) {
      setSelectedSession(preloadSession);
      localStorage.removeItem('rocker-load-session');
    }
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession);
    }
  }, [selectedSession]);

  useEffect(() => {
    // Realtime updates for new messages/sessions
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel('ai-management')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rocker_conversations' }, (payload: any) => {
          const row = payload.new as any;
          if (row.user_id !== user.id) return;
          // If it's a new session id, refresh sessions list
          setSessions(prev => {
            const exists = prev.some(s => s.session_id === row.session_id);
            if (!exists) {
              // lightweight reload
              loadSessions();
            }
            return prev;
          });
          if (selectedSession && row.session_id === selectedSession) {
            setMessages(prev => [...prev, { role: row.role, content: row.content, created_at: row.created_at }]);
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_sessions' }, (payload: any) => {
          const row = payload.new as any;
          setSessions(prev => [{
            session_id: row.session_id,
            title: row.title || 'Voice Conversation',
            summary: row.summary || '',
            created_at: row.created_at,
            updated_at: row.updated_at,
            message_count: 0
          }, ...prev]);
        })
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [selectedSession]);

  async function loadSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('conversation_sessions')
        .select('session_id, title, summary, updated_at, created_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (sessionsData && sessionsData.length > 0) {
        const sessionIds = sessionsData.map((row: any) => row.session_id);
        const { data: msgs, error: msgsErr } = await supabase
          .from('rocker_conversations')
          .select('session_id')
          .eq('user_id', user.id)
          .in('session_id', sessionIds);
        
        if (msgsErr) throw msgsErr;
        
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

  async function loadMemories() {
    setLoadingMemories(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_user_memory')
        .select('id, type, key, value, confidence, tags, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMemories(data || []);
    } catch (e) {
      console.error('Failed to load memories:', e);
    } finally {
      setLoadingMemories(false);
    }
  }

  async function deleteSession(sessionId: string) {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: msgsError } = await supabase
        .from('rocker_conversations')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (msgsError) throw msgsError;

      const { error: sessError } = await supabase
        .from('conversation_sessions')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (sessError) throw sessError;

      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error('Failed to delete conversation');
      console.error(error);
    }
  }

  function openInChat(sessionId: string) {
    localStorage.setItem('rocker-load-session', sessionId);
    window.dispatchEvent(new CustomEvent('rocker-open-session', { 
      detail: { sessionId } 
    }));
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatTimestamp(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }

  return (
    <>
      <GlobalHeader />
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">AI Management</h1>
            <p className="text-muted-foreground mt-2">Manage your conversations, memories, and AI preferences</p>
          </div>

          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat History
              </TabsTrigger>
              <TabsTrigger value="memories">
                <Brain className="h-4 w-4 mr-2" />
                Memories
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversations List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Conversations</CardTitle>
                    <CardDescription>{sessions.length} total</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
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
                                    <span>• {session.message_count} msgs</span>
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openInChat(session.session_id);
                                    }}
                                    title="Open in chat"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteSession(session.session_id);
                                    }}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Full Conversation View */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>
                      {selectedSession 
                        ? sessions.find(s => s.session_id === selectedSession)?.title || 'Conversation'
                        : 'Select a conversation'
                      }
                    </CardTitle>
                    {selectedSession && (
                      <CardDescription>
                        {messages.length} messages
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {!selectedSession ? (
                      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select a conversation to view full details</p>
                        </div>
                      </div>
                    ) : loadingMessages ? (
                      <div className="flex items-center justify-center h-[600px]">
                        <p className="text-muted-foreground">Loading messages...</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[600px]">
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
              </div>
            </TabsContent>

            <TabsContent value="memories" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>AI Memories</CardTitle>
                    <CardDescription>What Rocker remembers about you</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={loadMemories} disabled={loadingMemories}>
                    {loadingMemories ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingMemories ? (
                    <p className="text-sm text-muted-foreground">Loading memories...</p>
                  ) : memories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No memories yet.</p>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-3 pr-4">
                        {memories.map((m) => (
                          <div key={m.id} className="p-3 rounded-lg border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs uppercase tracking-wide text-muted-foreground">{m.type}</span>
                              <span className="text-xs text-muted-foreground">{formatDate(m.created_at)}</span>
                            </div>
                            <p className="font-medium text-sm">{m.key}</p>
                            <pre className="mt-1 text-xs whitespace-pre-wrap">
                              {typeof m.value === 'string' ? m.value : JSON.stringify(m.value, null, 2)}
                            </pre>
                            {Array.isArray(m.tags) && m.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {m.tags.map((t: string, i: number) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Settings</CardTitle>
                  <CardDescription>Configure AI behavior and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Settings coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
