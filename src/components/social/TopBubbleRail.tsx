import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type Bubble = {
  id: string;
  display_name: string;
  handle?: string | null;
  kind: 'person' | 'horse' | 'business';
  avatar_url?: string | null;
  status?: string | null;
};

type Props = {
  bubbles: Bubble[];
  canReorder?: boolean;                   // owner can drag
  onReorder?: (orderedIds: string[]) => void;
  onTogglePublic?: (ref_id: string, is_public: boolean) => void;
  publicStates?: Map<string, boolean>;    // current public state per bubble
};

export function TopBubbleRail({ bubbles, canReorder, onReorder, onTogglePublic, publicStates }: Props) {
  const nav = useNavigate();
  const [order, setOrder] = React.useState(bubbles.map(b => b.id));
  React.useEffect(() => setOrder(bubbles.map(b => b.id)), [bubbles]);

  // naive drag & drop without a lib (fine for 8 items)
  const dragId = React.useRef<string | null>(null);
  const onDragStart = (id: string) => (e: React.DragEvent) => {
    if (!canReorder) return;
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (overId: string) => (e: React.DragEvent) => {
    if (!canReorder || dragId.current === overId) return;
    e.preventDefault();
    const from = order.indexOf(dragId.current!);
    const to = order.indexOf(overId);
    if (from === -1 || to === -1) return;
    const next = [...order];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setOrder(next);
  };
  const onDragEnd = () => {
    if (!canReorder || !onReorder) return;
    onReorder(order);
    dragId.current = null;
  };

  const bubbleSize = 72;

  return (
    <div
      role="listbox"
      aria-label="Pinned favorites"
      className="w-full overflow-x-auto no-scrollbar py-2"
    >
      <div className="flex gap-4 px-2">
        {order.map(id => {
          const b = bubbles.find(x => x.id === id);
          if (!b) return null;
          const initials = b.display_name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
          const isPublic = publicStates?.get(b.id) ?? true;

          return (
            <div
              key={b.id}
              role="option"
              aria-label={`Open ${b.display_name}`}
              draggable={!!canReorder}
              onDragStart={onDragStart(b.id)}
              onDragOver={onDragOver(b.id)}
              onDragEnd={onDragEnd}
              className="flex flex-col items-center gap-1 min-w-[72px] select-none group"
            >
              <button
                className={cn(
                  "relative rounded-full overflow-hidden shrink-0 transition-all",
                  "bg-gradient-to-br from-primary/20 to-primary/5",
                  "border border-border/60 hover:scale-105 active:scale-95",
                  canReorder && "cursor-grab active:cursor-grabbing"
                )}
                style={{ width: bubbleSize, height: bubbleSize }}
                onClick={() => nav(`/entities/${b.id}`)}
                title={b.display_name}
              >
                {b.avatar_url ? (
                  <img
                    src={b.avatar_url}
                    alt={b.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-foreground/80 text-lg font-medium">
                    {initials}
                  </div>
                )}
              </button>

              <div className="text-xs text-foreground/80 max-w-[76px] text-center line-clamp-1 font-medium">
                {b.display_name}
              </div>

              {canReorder && (
                <div className="flex items-center gap-1.5 text-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3" />
                  {onTogglePublic && (
                    <button
                      className="p-0.5 rounded hover:bg-accent/40 transition-colors"
                      onClick={() => onTogglePublic(b.id, !isPublic)}
                      title={isPublic ? 'Hide from public profile' : 'Show on public profile'}
                    >
                      {isPublic ? (
                        <Eye className="w-3 h-3 text-foreground/60" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-foreground/30" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
