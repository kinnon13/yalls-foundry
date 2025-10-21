import { useState, useEffect, lazy, Suspense } from 'react';
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
import { Button } from '@/components/ui/button';
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

type Tab = 'chat' | 'knowledge' | 'tasks' | 'memory' | 'files' | 'inbox' | 'admin' | 'capabilities' | 'secrets' | 'users';

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
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-12 border-b bg-card/50 backdrop-blur-sm flex items-center px-6 shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Super Rocker</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[280px] border-r bg-card/30 flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="px-6 py-6 border-b">
            <h2 className="text-sm font-semibold text-foreground mb-1">AI Workspace</h2>
            <p className="text-xs text-muted-foreground">Super admin control center</p>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {modules.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeTab === mod.id;
                
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveTab(mod.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-background">
          <div className="h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8">
              {activeTab === 'chat' && (
                <div className="h-[calc(100vh-10rem)]">
                  <SuperRockerChat threadId={threadId} onThreadCreated={setThreadId} />
                </div>
              )}

              {activeTab === 'knowledge' && <SuperRockerKnowledge />}
              {activeTab === 'tasks' && <SuperRockerTasks threadId={threadId} />}
              {activeTab === 'memory' && <SuperRockerMemory />}
              {activeTab === 'files' && <FileBrowser />}
              {activeTab === 'inbox' && <SuperRockerInbox />}
              {activeTab === 'admin' && <SuperRockerAdmin />}
              
              {activeTab === 'capabilities' && (
                <Suspense fallback={<div className="py-8 text-muted-foreground">Loading capabilities...</div>}>
                  <SuperAdminCapabilities />
                </Suspense>
              )}

              {activeTab === 'secrets' && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">API Keys & Secrets</h1>
                    <p className="text-muted-foreground">
                      Manage your API keys and integration secrets
                    </p>
                  </div>
                  <div className="p-6 border rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground">
                      Navigate to Settings → API Keys to manage secrets
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
