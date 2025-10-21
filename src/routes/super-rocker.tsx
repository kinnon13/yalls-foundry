import { useState, useEffect, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
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
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { 
  Brain, 
  Database, 
  CheckSquare, 
  FolderOpen, 
  Inbox, 
  MessageSquare,
  Shield,
  Key,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SuperAdminCapabilities = lazy(() => 
  import('@/components/admin/SuperAdminControls').then(m => ({ default: m.SuperAdminControls }))
);
const SettingsKeysPage = lazy(() => import('@/pages/SettingsKeys'));

type Tab = 'chat' | 'knowledge' | 'tasks' | 'memory' | 'files' | 'inbox' | 'admin' | 'capabilities' | 'secrets';

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
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Super Rocker...</p>
        </div>
      </div>
    );
  }

  const modules = [
    { id: 'chat' as Tab, label: 'Chat', icon: MessageSquare },
    { id: 'knowledge' as Tab, label: 'Knowledge', icon: Database },
    { id: 'tasks' as Tab, label: 'Tasks', icon: CheckSquare },
    { id: 'memory' as Tab, label: 'Memory', icon: Brain },
    { id: 'files' as Tab, label: 'Files', icon: FolderOpen },
    { id: 'inbox' as Tab, label: 'Inbox', icon: Inbox },
    { id: 'admin' as Tab, label: 'Andy Admin', icon: Users },
    { id: 'capabilities' as Tab, label: 'Capabilities', icon: Shield },
    { id: 'secrets' as Tab, label: 'API Keys', icon: Key },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Helmet>
        <title>Super Rocker — AI Workspace</title>
        <meta name="description" content="Super admin AI workspace with chat, knowledge, tasks, memory, files, inbox, capabilities, and API keys." />
        <link rel="canonical" href={`${window.location.origin}/super-rocker`} />
      </Helmet>

      {/* Global Header */}
      <div className="h-[var(--header-h)] shrink-0 z-40">
        <GlobalHeader />
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[260px] border-r border-border/40 bg-card/30 backdrop-blur-xl flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="px-5 py-6 border-b border-border/40">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <Brain className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">Super Rocker</span>
            </div>
            <p className="text-xs text-muted-foreground pl-10.5">AI workspace</p>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2.5">
            <div className="space-y-0.5">
              {modules.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeTab === mod.id;
                
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveTab(mod.id)}
                    className={cn(
                      'w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      isActive ? "" : "group-hover:scale-110"
                    )} />
                    <span className="tracking-wide">{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="px-5 py-4 border-t border-border/40">
            <div className="text-[11px] text-muted-foreground/60 space-y-0.5">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-8">
              <div className="animate-fade-in">
                {activeTab === 'chat' && (
                  <div className="h-[calc(100vh-12rem)] rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 overflow-hidden">
                    <SuperRockerChat threadId={threadId} onThreadCreated={setThreadId} />
                  </div>
                )}

                {activeTab === 'knowledge' && (
                  <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 p-6">
                    <SuperRockerKnowledge />
                  </div>
                )}
                
                {activeTab === 'tasks' && (
                  <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 p-6">
                    <SuperRockerTasks threadId={threadId} />
                  </div>
                )}
                
                {activeTab === 'memory' && (
                  <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 p-6">
                    <SuperRockerMemory />
                  </div>
                )}
                
                {activeTab === 'files' && (
                  <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 p-6">
                    <FileBrowser />
                  </div>
                )}
                
                {activeTab === 'inbox' && (
                  <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 p-6">
                    <SuperRockerInbox />
                  </div>
                )}
                
                {activeTab === 'admin' && (
                  <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 p-6">
                    <SuperRockerAdmin />
                  </div>
                )}

                {activeTab === 'capabilities' && (
                  <Suspense fallback={
                    <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 p-8">
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-3">
                          <Shield className="h-8 w-8 animate-pulse text-primary mx-auto" />
                          <p className="text-sm text-muted-foreground">Loading capabilities...</p>
                        </div>
                      </div>
                    </div>
                  }>
                    <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 overflow-hidden">
                      <SuperAdminCapabilities />
                    </div>
                  </Suspense>
                )}

                {activeTab === 'secrets' && (
                  <Suspense fallback={
                    <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 p-8">
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-3">
                          <Key className="h-8 w-8 animate-pulse text-primary mx-auto" />
                          <p className="text-sm text-muted-foreground">Loading API keys...</p>
                        </div>
                      </div>
                    </div>
                  }>
                    <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/5 overflow-hidden">
                      <SettingsKeysPage />
                    </div>
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
