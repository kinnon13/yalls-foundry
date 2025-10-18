/**
 * BubbleRail - Horizontal virtualized bubble scroller
 * 
 * Infinite horizontal scroll with auto-center on active bubble
 * Long-press for quick actions
 */

import { useRef, useEffect, useState } from 'react';
import type { BubbleItem } from '@/routes/social';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useReducedMotion } from '@/lib/a11y/useReducedMotion';

interface BubbleRailProps {
  items: BubbleItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export function BubbleRail({ items, activeId, onChange }: BubbleRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-center active bubble
  useEffect(() => {
    if (activeRef.current && railRef.current) {
      const rail = railRef.current;
      const bubble = activeRef.current;
      const scrollLeft = bubble.offsetLeft - rail.offsetWidth / 2 + bubble.offsetWidth / 2;
      rail.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeId]);

  const getBubbleInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
      <div
        ref={railRef}
        role="listbox"
        aria-label="Profiles"
        className="flex gap-4 px-4 py-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          
          return (
            <button
              key={item.id}
              ref={isActive ? activeRef : null}
              onClick={() => onChange(item.id)}
              role="option"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(item.id);
                }
              }}
              className="flex-shrink-0 snap-center group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
              aria-label={`View ${item.display_name}`}
            >
              {/* Ring */}
              <div
                onMouseMove={!prefersReducedMotion ? (e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
                  const y = ((e.clientY - r.top) / r.height - 0.5) * -10;
                  e.currentTarget.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateZ(6px)`;
                } : undefined}
                onMouseLeave={(e) => {
                  if (!prefersReducedMotion) {
                    e.currentTarget.style.transform = 'none';
                  }
                }}
                className={`w-20 h-20 rounded-full p-1 transition-all will-change-transform ${
                  isActive ? 'scale-110' : 'scale-100 opacity-70 group-hover:opacity-100'
                }`}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${item.ring_color}, ${item.ring_color})`
                    : 'transparent',
                  border: isActive ? 'none' : `2px solid ${item.ring_color}`,
                }}
              >
                <Avatar className="w-full h-full border-2 border-background">
                  <AvatarImage src={item.avatar_url} alt={item.display_name} />
                  <AvatarFallback className="text-sm font-medium">
                    {getBubbleInitials(item.display_name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <p className={`text-xs truncate max-w-[80px] ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                  {item.display_name}
                </p>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
