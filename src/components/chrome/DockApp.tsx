/**
 * DockApp - Single sortable dock app icon
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LucideIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PinnedApp } from '@/hooks/usePinnedApps';

interface DockAppProps {
  app: PinnedApp;
  Icon: LucideIcon;
  isEditMode: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export function DockApp({ app, Icon, isEditMode, onClick, onRemove }: DockAppProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "dock-icon relative",
        isEditMode && "animate-jiggle cursor-move",
        isDragging && "opacity-50"
      )}
      {...attributes}
      {...listeners}
    >
      <button
        onClick={onClick}
        className="w-full h-full"
        title={app.label}
        disabled={isEditMode}
      >
        <div className={`w-full h-full rounded-[24%] bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] border border-white/10`}>
          <Icon className={`w-7 h-7 drop-shadow-lg ${app.color}`} strokeWidth={1.75} />
          <div className="absolute inset-0 rounded-[24%] bg-gradient-to-t from-white/5 to-transparent opacity-50" />
        </div>
      </button>
      
      {/* Remove button in edit mode */}
      {isEditMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center shadow-lg z-10 hover:scale-110 transition-transform"
        >
          <X className="w-3 h-3 text-destructive-foreground" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
