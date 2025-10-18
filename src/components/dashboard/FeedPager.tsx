/**
 * FeedPager - Swipeable tab pager for feed content
 */

import { useState, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FeedPagerProps {
  tab: string;
  tabs: string[];
  onTabChange: (tab: string) => void;
  children: ReactNode;
}

export function FeedPager({ tab, tabs, onTabChange, children }: FeedPagerProps) {
  const index = tabs.indexOf(tab);
  const startX = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current !== null) {
      setDrag(e.clientX - startX.current);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current !== null) {
      // Threshold: 80px swipe to switch tabs
      if (drag < -80 && index < tabs.length - 1) {
        onTabChange(tabs[index + 1]);
      } else if (drag > 80 && index > 0) {
        onTabChange(tabs[index - 1]);
      }
    }
    startX.current = null;
    setDrag(0);
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className={cn(
        "relative h-full touch-pan-y",
        isDragging && "cursor-grabbing select-none",
        !isDragging && "cursor-grab"
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className={cn(
          "h-full flex",
          !isDragging && "transition-transform duration-300"
        )}
        style={{ 
          transform: `translateX(calc(${drag}px - ${index * 100}%))`,
          willChange: isDragging ? 'transform' : 'auto'
        }}
      >
        {Array.isArray(children) ? children.map((child, i) => (
          <div key={i} className="w-full h-full shrink-0">
            {child}
          </div>
        )) : <div className="w-full h-full shrink-0">{children}</div>}
      </div>
    </div>
  );
}
