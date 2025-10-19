/**
 * Global Header - Mac-style top bar
 */

import { Bell, ShoppingCart, LogOut } from 'lucide-react';

export default function HeaderBar() {
  return (
    <header className="header">
      <div className="brand">Y'alls.Ai</div>

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
