import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { useSuperAdminCheck } from '@/hooks/useSuperAdminCheck';
import { AppDock, AppId } from '@/components/super-rocker/AppDock';
import { CenterStage } from '@/components/super-rocker/CenterStage';
import { MessengerRail } from '@/components/super-rocker/MessengerRail';
import { Brain, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SuperRocker() {
  const { session } = useSession();
  const { isSuperAdmin, isLoading } = useSuperAdminCheck();
  const navigate = useNavigate();
  const [activeApp, setActiveApp] = useState<AppId>('knowledge');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Super Rocker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <Helmet>
        <title>Super Rocker — AI Workspace</title>
        <meta name="description" content="Super admin AI workspace with knowledge, memory, tasks, files, inbox, capabilities, admin, and API keys." />
        <link rel="canonical" href={`${window.location.origin}/super-rocker`} />
      </Helmet>

      {/* Top Bar */}
      <div className="sticky top-0 z-50 h-14 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/25">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">Super Rocker</span>
          </div>
          
          <div className="relative flex-1 max-w-xl mx-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search (⌘K)"
              className="h-9 pl-9 rounded-xl border-border/40 bg-background/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-muted-foreground hidden sm:block">Super Admin</div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_400px] gap-4 p-4 md:p-6 h-[calc(100vh-3.5rem)]">
        {/* Left: App Dock */}
        <aside className="hidden lg:block rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <AppDock activeApp={activeApp} onAppChange={setActiveApp} />
        </aside>

        {/* Center: Stage */}
        <main className="rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <CenterStage activeApp={activeApp} threadId={threadId} />
        </main>

        {/* Right: Messenger Rail */}
        <aside className="hidden lg:block rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <MessengerRail />
        </aside>
      </div>

      {/* Mobile App Dock (bottom) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/40 pb-safe">
        <AppDock activeApp={activeApp} onAppChange={setActiveApp} />
      </div>
    </div>
  );
}
