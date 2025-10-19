/**
 * Global Header - Mac-style top bar
 */

import { useSearchParams } from 'react-router-dom';
import { Bell, ShoppingCart, LogOut } from 'lucide-react';

export default function HeaderBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get('mode') ?? 'social') as 'social' | 'manage';

  const setMode = (m: 'social' | 'manage') => {
    const next = new URLSearchParams(searchParams);
    if (m === 'social') {
      next.delete('mode');
    } else {
      next.set('mode', m);
    }
    setSearchParams(next);
  };

  return (
    <header className="header">
      <div className="brand">Y'alls.Ai</div>
      
      <div className="seg">
        <button 
          aria-pressed={mode === 'social'} 
          onClick={() => setMode('social')}
        >
          Social
        </button>
        <button 
          aria-pressed={mode === 'manage'} 
          onClick={() => setMode('manage')}
        >
          Manage
        </button>
      </div>

      <input 
        className="search" 
        placeholder="Search people, businesses, apps…" 
        type="search"
      />

      <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
        <button className="dock-icon" title="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <button className="dock-icon" title="Cart">
          <ShoppingCart className="h-5 w-5" />
        </button>
        <button className="dock-icon" title="Logout">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
