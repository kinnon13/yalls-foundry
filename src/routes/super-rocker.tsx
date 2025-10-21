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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-14 border-b flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Super Rocker</h1>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Rail Navigation */}
        <aside className="w-64 border-r flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground">AI WORKSPACE</h2>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-2">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeTab === mod.id;
              
              return (
                <Button
                  key={mod.id}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 mb-1',
                    isActive && 'bg-accent'
                  )}
                  onClick={() => setActiveTab(mod.id)}
                >
                  <Icon className="h-4 w-4" />
                  {mod.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 max-w-7xl mx-auto">
            {activeTab === 'chat' && (
              <div className="h-[calc(100vh-8rem)]">
                <SuperRockerChat threadId={threadId} onThreadCreated={setThreadId} />
              </div>
            )}

            {activeTab === 'knowledge' && (
              <div>
                <SuperRockerKnowledge />
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <SuperRockerTasks threadId={threadId} />
              </div>
            )}

            {activeTab === 'memory' && (
              <div>
                <SuperRockerMemory />
              </div>
            )}

            {activeTab === 'files' && (
              <div>
                <FileBrowser />
              </div>
            )}

            {activeTab === 'inbox' && (
              <div>
                <SuperRockerInbox />
              </div>
            )}

            {activeTab === 'admin' && (
              <div>
                <SuperRockerAdmin />
              </div>
            )}

            {activeTab === 'capabilities' && (
              <Suspense fallback={<div className="p-6">Loading...</div>}>
                <SuperAdminCapabilities />
              </Suspense>
            )}

            {activeTab === 'secrets' && (
              <div>
                <h1 className="text-2xl font-bold mb-4">API Keys & Secrets</h1>
                <p className="text-muted-foreground mb-6">
                  Manage your API keys and integration secrets
                </p>
                <div className="text-sm text-muted-foreground">
                  Navigate to Settings → API Keys to manage secrets
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
