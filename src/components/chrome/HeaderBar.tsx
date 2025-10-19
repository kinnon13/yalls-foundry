/**
 * Global Header - Mac-style top bar
 */

import { Bell, ShoppingCart } from 'lucide-react';
import { UserProfileMenu } from '@/components/profile/UserProfileMenu';

export default function HeaderBar() {
  return (
    <header className="header">
      <div className="brand">Y'alls.Ai</div>

      <input 
        className="search" 
        placeholder="Search people, businesses, apps…" 
        type="search"
      />

      <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto', alignItems: 'center' }}>
        <button className="dock-icon" title="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <button className="dock-icon" title="Cart">
          <ShoppingCart className="h-5 w-5" />
        </button>
        <UserProfileMenu />
      </div>
    </header>
  );
}
