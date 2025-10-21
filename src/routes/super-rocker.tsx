import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { useSuperAdminCheck } from '@/hooks/useSuperAdminCheck';
import { SuperRockerChat } from '@/components/super-rocker/SuperRockerChat';
import { SuperRockerKnowledge } from '@/components/super-rocker/SuperRockerKnowledge';
import { SuperRockerTasks } from '@/components/super-rocker/SuperRockerTasks';
import { SuperRockerMemory } from '@/components/super-rocker/SuperRockerMemory';
import { SuperRockerInbox } from '@/components/super-rocker/SuperRockerInbox';
import { FileBrowser } from '@/components/super-rocker/FileBrowser';
import { SuperRockerAdmin } from '@/components/super-rocker/SuperRockerAdmin';
import { Brain, Database, CheckSquare, FolderOpen, Inbox, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'chat' | 'knowledge' | 'tasks' | 'memory' | 'files' | 'inbox' | 'admin';

export default function SuperRocker() {
  const { session } = useSession();
  const { isSuperAdmin, isLoading } = useSuperAdminCheck();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      navigate('/');
    }
  }, [isSuperAdmin, isLoading, navigate]);

  useEffect(() => {
    const initThread = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('rocker_threads')
        .select('id')
        .eq('user_id', session?.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setThreadId(data.id);
      }
    };
    if (session?.userId) initThread();
  }, [session?.userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading Super Rocker...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'chat' as Tab, label: 'Chat', icon: MessageSquare },
    { id: 'knowledge' as Tab, label: 'Knowledge', icon: Database },
    { id: 'tasks' as Tab, label: 'Tasks', icon: CheckSquare },
    { id: 'memory' as Tab, label: 'Memory', icon: Brain },
    { id: 'files' as Tab, label: 'Files', icon: FolderOpen },
    { id: 'inbox' as Tab, label: 'Inbox', icon: Inbox },
    { id: 'admin' as Tab, label: 'Admin', icon: Brain },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Mac-style header */}
      <div className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="h-14 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">Super Rocker</h1>
          </div>
          <div className="flex items-center gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-6 py-6">
          {activeTab === 'chat' && (
            <div className="h-full bg-card rounded-xl border shadow-sm">
              <div className="p-6 h-full">
                <SuperRockerChat threadId={threadId} onThreadCreated={setThreadId} />
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="h-full bg-card rounded-xl border shadow-sm overflow-auto">
              <div className="p-6">
                <SuperRockerKnowledge />
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="h-full bg-card rounded-xl border shadow-sm overflow-auto">
              <div className="p-6">
                <SuperRockerTasks threadId={threadId} />
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="h-full bg-card rounded-xl border shadow-sm overflow-auto">
              <div className="p-6">
                <SuperRockerMemory />
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="h-full bg-card rounded-xl border shadow-sm overflow-auto">
              <div className="p-6">
                <FileBrowser />
              </div>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="h-full bg-card rounded-xl border shadow-sm overflow-auto">
              <div className="p-6">
                <SuperRockerInbox />
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="h-full bg-card rounded-xl border shadow-sm overflow-auto">
              <div className="p-6">
                <SuperRockerAdmin />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
