/**
 * Global Header - Mac-style top bar
 */

import { Bell, ShoppingCart } from 'lucide-react';
import { UserProfileMenu } from '@/components/profile/UserProfileMenu';
import { RockerIcon } from '@/components/ai/RockerIcon';
import { AdminIcon } from '@/components/admin/AdminIcon';
import { useRockerGlobal } from '@/lib/ai/rocker';

export default function HeaderBar() {
  const { setIsOpen } = useRockerGlobal();

  return (
    <header className="header">
      <div className="brand">Y'alls.Ai</div>

      <input 
        className="search" 
        placeholder="Search people, businesses, apps…" 
        type="search"
      />

      <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto', alignItems: 'center' }}>
        <button 
          className="dock-icon" 
          title="Rocker AI"
          onClick={() => setIsOpen(true)}
        >
          <RockerIcon className="w-6 h-6" />
        </button>
        <button className="dock-icon" title="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <button className="dock-icon" title="Cart">
          <ShoppingCart className="h-5 w-5" />
        </button>
        <AdminIcon />
        <UserProfileMenu />
      </div>
    </header>
  );
}
