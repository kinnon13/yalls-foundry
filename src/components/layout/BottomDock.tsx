import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, Store, Globe2, AppWindow } from 'lucide-react';
import { useState } from 'react';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function BottomDock() {
  const [createOpen, setCreateOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const nav = useNavigate();

  const handleCreate = (route: string) => {
    setCreateOpen(false);
    nav(route);
  };

  return (
    <>
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} onSelect={handleCreate} />

      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-4">
        <div className="
          pointer-events-auto
          flex items-center gap-8
          rounded-full border border-white/10 bg-[color-mix(in_srgb,var(--background),transparent_20%)]
          shadow-[0_10px_30px_-10px_rgba(0,0,0,.6)]
          backdrop-blur-md px-6 py-3
        ">
          <DockItem onClick={() => setChatOpen(true)} label="Messages">
            <MessageCircle />
          </DockItem>

          {/* Center create button */}
          <button
            onClick={() => setCreateOpen(true)}
            className="group grid place-items-center rounded-full size-12
                       bg-gradient-to-b from-primary/90 to-primary text-white
                       shadow-[0_8px_20px_-6px_rgba(0,0,0,.5)]
                       hover:scale-105 transition-all duration-200"
            aria-label="Create"
          >
            <Plus className="size-6" />
          </button>

          <DockItem to="/marketplace" label="Marketplace">
            <Store />
          </DockItem>
          <DockItem to="/unclaimed" label="Unclaimed">
            <Globe2 />
          </DockItem>
          <DockItem to="/app-store" label="App Store">
            <AppWindow />
          </DockItem>
        </div>
      </div>
    </>
  );
}

function DockItem({ 
  to, 
  onClick, 
  label, 
  children 
}: { 
  to?: string; 
  onClick?: () => void;
  label: string; 
  children: React.ReactNode;
}) {
  const content = (
    <>
      <div className="
        grid place-items-center rounded-2xl size-10
        bg-white/[0.04] border border-white/10
        shadow-[inset_0_1px_0_0_rgba(255,255,255,.06)]
        group-hover:bg-white/[0.08] transition-all duration-200
      ">
        <span className="[&>*]:size-[22px] text-white/90">{children}</span>
      </div>
      <span className="text-white/70">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="group flex flex-col items-center gap-1 text-[13px] leading-none"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-1 text-[13px] leading-none"
    >
      {content}
    </button>
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
