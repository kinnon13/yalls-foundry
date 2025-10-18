import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Plus, Store, Globe2, AppWindow } from 'lucide-react';
import { useState } from 'react';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { openInWorkspace } from '@/routes/home/parts/WorkspaceHost';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function BottomDock() {
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [chatOpen, setChatOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = (route: string) => {
    setCreateOpen(false);
    nav(route);
  };

  const Item = ({ onClick, children, label }: { onClick: () => void; children: React.ReactNode; label: string }) => (
    <button 
      onClick={onClick} 
      title={label}
      aria-label={label}
      className="size-11 grid place-items-center rounded-xl bg-card/70 border border-border/60 hover:bg-accent/40 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <>
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} onSelect={handleCreate} />
      
      <div className="h-14 border-t border-border bg-background/80 backdrop-blur px-3">
        <div className="h-full max-w-[680px] mx-auto flex items-center justify-between gap-4">
          <Item onClick={() => setChatOpen(true)} label="Messages">
            <MessageCircle className="w-5 h-5" />
          </Item>
          <Item onClick={() => setCreateOpen(true)} label="Create">
            <Plus className="w-5 h-5" />
          </Item>
          <Item onClick={() => openInWorkspace(sp, setSp, 'marketplace')} label="Marketplace">
            <Store className="w-5 h-5" />
          </Item>
          <Item onClick={() => nav('/unclaimed')} label="Unclaimed">
            <Globe2 className="w-5 h-5" />
          </Item>
          <Item onClick={() => nav('/app-store')} label="App Store">
            <AppWindow className="w-5 h-5" />
          </Item>
        </div>
      </div>
    </>
  );
}

function CreateSheet({
  open,
  onClose,
  onSelect
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (route: string) => void;
}) {
  const createOptions = [
    { label: 'Profile', route: '/profiles/new' },
    { label: 'Business', route: '/businesses/new' },
    { label: 'Horse', route: '/horses/new' },
    { label: 'Farm', route: '/farms/new' },
    { label: 'Post', route: '/post/new' },
    { label: 'Listing', route: '/listings/new' },
    { label: 'Event', route: '/events/new' },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Create</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {createOptions.map((option) => (
            <button
              key={option.route}
              onClick={() => onSelect(option.route)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left
                         hover:bg-white/[0.08] transition-all duration-200"
            >
              {option.label}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
