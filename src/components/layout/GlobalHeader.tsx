import { Link, useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, LogOut, Home, Search } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type Props = {
  notifCount?: number;
  cartCount?: number;
  className?: string;
};

export function GlobalHeader({ notifCount = 0, cartCount = 0, className }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
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
      <div className="mx-auto max-w-[1400px] h-full px-3 md:px-4 flex items-center gap-3">
        {/* Brand / Home */}
        <Link
          to="/home"
          className="inline-flex items-center gap-2 font-semibold tracking-tight"
          aria-label="Yalls.ai Home"
        >
          <Home className="h-5 w-5" />
          <span className="hidden sm:inline">yalls.ai</span>
        </Link>

        {/* Search (desktop/tablet) */}
        <form onSubmit={onSearch} className="hidden md:flex items-center gap-2 grow max-w-2xl ml-2">
          <div className="relative grow">
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

        {/* Right actions */}
        <nav aria-label="Top actions" className="ml-auto flex items-center gap-2">
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
            className="inline-flex items-center gap-2 h-10 px-3 rounded-md border border-border/60 hover:bg-accent/40 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
