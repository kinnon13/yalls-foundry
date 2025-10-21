import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { AppDock } from '@/components/admin-rocker/AppDock';
import { CenterStage } from '@/components/admin-rocker/CenterStage';
import { MessengerRail } from '@/components/admin-rocker/MessengerRail';
import { Brain, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { AppId } from '@/components/admin-rocker/AppDock';

export default function AdminRocker() {
  const { session } = useSession();
  const { isAdmin, isLoading } = useRoles();
  const navigate = useNavigate();
  const [activeApp, setActiveApp] = useState<AppId>('knowledge');
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    const initThread = async () => {
      if (!session?.userId) return;
      
      try {
        const query = (supabase as any)
          .from('rocker_threads')
          .select('id')
          .eq('user_id', session.userId)
          .eq('actor_role', 'admin')
          .order('created_at', { ascending: false })
          .limit(1);
        
        const { data } = await query.maybeSingle();
        
        if (data?.id) {
          setThreadId(String(data.id));
        }
      } catch (err) {
        console.error('Error loading thread:', err);
      }
    };
    initThread();
  }, [session?.userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Admin Rocker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <Helmet>
        <title>Admin Rocker — Admin AI Workspace</title>
        <meta name="description" content="Admin AI workspace with access to knowledge, tasks, files, analytics, and team management capabilities." />
        <link rel="canonical" href={`${window.location.origin}/admin-rocker`} />
      </Helmet>

      {/* Top Bar */}
      <div className="sticky top-0 z-50 h-14 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="h-full px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/25">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">Admin Rocker</span>
          </div>
          
          <div className="relative flex-1 max-w-xl mx-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search (⌘K)"
              className="h-9 pl-9 rounded-xl border-border/40 bg-background/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-muted-foreground hidden sm:block">Admin</div>
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
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
