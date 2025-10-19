/**
 * Bottom Dock
 * Icons only: Messages, Create, Marketplace, Unclaimed, App Store
 */

import { MessageCircle, Plus, ShoppingBag, AlertCircle, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CreateSheet } from './CreateSheet';
import { rocker } from '@/lib/rocker/event-bus';

export function Dock() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const handleNav = (path: string, label: string) => {
    rocker.emit('dock_click', { metadata: { target: label } });
    navigate(path);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-[var(--dock-h)] bg-background border-t z-40 flex items-center justify-around px-4">
        <DockButton
          icon={MessageCircle}
          label="Messages"
          onClick={() => handleNav('/?app=messages', 'Messages')}
        />
        
        <DockButton
          icon={Plus}
          label="Create"
          onClick={() => setShowCreate(true)}
          variant="primary"
        />
        
        <DockButton
          icon={ShoppingBag}
          label="Marketplace"
          onClick={() => handleNav('/?app=marketplace', 'Marketplace')}
        />
        
        <DockButton
          icon={AlertCircle}
          label="Unclaimed"
          onClick={() => handleNav('/entities?unclaimed=true', 'Unclaimed')}
        />
        
        <DockButton
          icon={Grid}
          label="App Store"
          onClick={() => handleNav('/?app=app-store', 'App Store')}
        />
      </div>

      <CreateSheet open={showCreate} onOpenChange={setShowCreate} />
    </>
  );
}

function DockButton({
  icon: Icon,
  label,
  onClick,
  variant = 'ghost',
}: {
  icon: any;
  label: string;
  onClick: () => void;
  variant?: 'ghost' | 'primary';
}) {
  return (
    <Button
      variant={variant === 'primary' ? 'default' : 'ghost'}
      size="sm"
      className={variant === 'primary' ? 'rounded-full h-12 w-12 p-0' : 'flex flex-col gap-1 h-auto'}
      onClick={onClick}
      aria-label={label}
    >
      <Icon className="h-5 w-5" />
      {variant === 'ghost' && <span className="text-xs">{label}</span>}
    </Button>
  );
}
