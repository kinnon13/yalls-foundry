import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { useSuperAdminCheck } from '@/hooks/useSuperAdminCheck';
import { AppDock, AppId } from '@/components/super-andy/AppDock';
import { CenterStage } from '@/components/super-andy/CenterStage';
import { MessengerRail } from '@/components/super-andy/MessengerRail';
import { Brain, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SuperAndy() {
  const { session } = useSession();
  const { isSuperAdmin, isLoading } = useSuperAdminCheck();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeApp, setActiveApp] = useState<AppId>('live');
  const [threadId, setThreadId] = useState<string | null>(null);

  // Auth check removed - Super Andy is always accessible

  // Read ?app= from URL and set the active app on load
  useEffect(() => {
    const appParam = searchParams.get('app');
    const validApps: AppId[] = ['live','knowledge','files','tasks','task-os','calendar','proactive','inbox','capabilities','admin','secrets','training','learn'];
    if (appParam && (validApps as string[]).includes(appParam)) {
      setActiveApp(appParam as AppId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync when activeApp changes
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    sp.set('app', activeApp);
    setSearchParams(sp, { replace: true });
  }, [activeApp, searchParams, setSearchParams]);

  // Dev override: auto sign-in anonymously on ?role=super so chat works in preview
  useEffect(() => {
    const role = searchParams.get('role');
    if (!session?.userId && role === 'super') {
      (async () => {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const auth = (supabase.auth as any);
          if (typeof auth.signInAnonymously === 'function') {
            await auth.signInAnonymously();
          } else {
            console.warn('[SuperAndy] Anonymous auth not available in this environment');
          }
        } catch (e) {
          console.error('[SuperAndy] Dev sign-in failed:', e);
        }
      })();
    }
  }, [session?.userId, searchParams]);

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

  // Allow Andy (via chat) to open apps like Calendar by intent
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const app = (e as any).detail?.app as AppId | undefined;
      const validApps: AppId[] = ['live','knowledge','files','tasks','task-os','calendar','proactive','inbox','capabilities','admin','secrets','training','learn'];
      if (app && (validApps as any).includes(app)) setActiveApp(app);
    };
    window.addEventListener('super-andy:navigate' as any, handler as any);
    return () => window.removeEventListener('super-andy:navigate' as any, handler as any);
  }, []);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Super Andy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <Helmet>
        <title>Super Andy — Everything AI Workspace</title>
        <meta name="description" content="Super admin everything AI workspace with full access to knowledge, memory, tasks, files, inbox, capabilities, admin controls, and API keys." />
        <link rel="canonical" href={`${window.location.origin}/super-andy`} />
      </Helmet>

      {/* Top Bar */}
      <div className="sticky top-0 z-50 h-14 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/25">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">Super Andy</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_400px] gap-4 p-4 md:p-6 h-[calc(100vh-3.5rem-var(--dock-h,0px))] pb-[calc(var(--dock-h,0px)+1rem)] lg:pb-6">
        {/* Left: App Dock */}
        <aside className="hidden lg:flex rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <AppDock activeApp={activeApp} onAppChange={setActiveApp} />
        </aside>

        {/* Center: Stage */}
        <main className="rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
          <CenterStage activeApp={activeApp} threadId={threadId} />
        </main>

      {/* Right: Messenger Rail */}
        <aside className="hidden lg:block min-h-0 h-full rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <MessengerRail threadId={threadId} />
        </aside>
      </div>

      {/* Mobile App Dock (bottom) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/40 pb-safe">
        <AppDock activeApp={activeApp} onAppChange={setActiveApp} />
      </div>
    </div>
  );
}
