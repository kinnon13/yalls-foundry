import { Link, useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, LogOut, Home, Search, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logout as canonicalLogout } from '@/lib/auth/logout';
import { cn } from '@/lib/utils';

type Props = {
  notifCount?: number;
  cartCount?: number;
  className?: string;
};

export function GlobalHeader({ notifCount = 0, cartCount = 0, className }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      setIsAdmin(!!data);
    };

    checkAdmin();
  }, []);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setMobileSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    
    // Emit search event for Rocker AI
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { rockerEvents } = await import('@/lib/rocker-events');
        await rockerEvents.searchPerformed(user.id, q.trim());
      }
    } catch (error) {
      console.error('[GlobalHeader] Failed to emit search event:', error);
    }
  };

  const logout = async () => {
    try {
      await canonicalLogout('user');
    } catch {}
  };

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-40 h-14 bg-background/80 backdrop-blur border-b border-border/60',
        className
      )}
      role="banner"
    >
      <div className="mx-auto max-w-screen-2xl h-full px-4 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        {/* Brand / Home */}
        <Link
          to="/home"
          className="inline-flex items-center gap-2 font-semibold tracking-tight"
          aria-label="Yalls.ai Home"
        >
          <Home className="h-5 w-5" />
          <span className="hidden sm:inline">yalls.ai</span>
        </Link>

        {/* Search (desktop/tablet) - Centered */}
        <div className="hidden md:flex flex-1 justify-center">
          <form onSubmit={onSearch} className="w-full max-w-2xl flex items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search people, businesses, apps…"
                className="w-full h-10 pl-9 pr-3 rounded-md border border-border/60 bg-background"
                aria-label="Search"
              />
            </div>
          </form>
        </div>

        {/* Mobile search toggle */}
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="md:hidden inline-grid place-items-center h-10 w-10 rounded-md border border-border/60 hover:bg-accent/40 transition-colors"
          aria-label="Toggle search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Right actions */}
        <nav aria-label="Top actions" className="ml-auto flex items-center gap-2">
          {/* Admin Control Room */}
          {isAdmin && (
            <Link
              to="/admin/control-room"
              className="inline-grid place-items-center h-10 w-10 rounded-md border border-border/60 bg-gradient-to-br from-purple-600/20 to-blue-600/10 hover:from-purple-600/30 hover:to-blue-600/20 transition-colors"
              aria-label="Admin Control Room"
              title="Admin Control Room"
            >
              <Shield className="h-5 w-5 text-purple-600" />
            </Link>
          )}

          {/* Notifications */}
          <Link
            to="/notifications"
            className="relative inline-grid place-items-center h-10 w-10 rounded-md border border-border/60 hover:bg-accent/40 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] grid place-items-center font-semibold">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/marketplace/cart"
            className="relative inline-grid place-items-center h-10 w-10 rounded-md border border-border/60 hover:bg-accent/40 transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] grid place-items-center font-semibold">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Logout */}
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground border border-destructive/30 transition-colors font-medium"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Mobile search dropdown */}
      {mobileSearchOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border/60 p-3">
          <form onSubmit={onSearch} className="flex items-center gap-2">
            <div className="relative grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search people, businesses, apps…"
                className="w-full h-10 pl-9 pr-3 rounded-md border border-border/60 bg-background"
                aria-label="Search"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
