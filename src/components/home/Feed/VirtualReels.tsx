import { useEffect, useRef } from 'react';
// @ts-ignore - react-window types
import { FixedSizeList as List } from 'react-window';

interface VirtualReelsProps {
  items: any[];
  height: number;
  width: number | string;
}

export function VirtualReels({ items, height, width }: VirtualReelsProps) {
  const listRef = useRef<any>(null);
  const itemSize = Math.round(height);

  const onItemsRendered = ({ visibleStartIndex, visibleStopIndex }: any) => {
    // Preload ±1
    const preload = [visibleStartIndex - 1, visibleStopIndex + 1].filter(i => i >= 0 && i < items.length);
    preload.forEach(i => items[i]?.preload?.());
    
    // Telemetry
    window.dispatchEvent(new CustomEvent('reel_view', { detail: { index: visibleStartIndex } }));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!listRef.current) return;
      
      const currentIndex = Math.floor(listRef.current.state.scrollOffset / itemSize);
      
      if (e.key === 'ArrowDown' && currentIndex < items.length - 1) {
        e.preventDefault();
        listRef.current.scrollToItem(currentIndex + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        listRef.current.scrollToItem(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, itemSize]);

  const widthPx = typeof width === 'string' ? width : `${width}px`;

  return (
    <List
      ref={listRef}
      height={height}
      width={widthPx}
      itemCount={items.length}
      itemSize={itemSize}
      onItemsRendered={onItemsRendered}
      overscanCount={2}
      style={{ willChange: 'transform' }}
    >
      {({ index, style }) => (
        <div style={style}>
          <div className="reel-item" style={{ height: itemSize, aspectRatio: '9/16' }}>
            {items[index]?.content || `Reel ${index + 1}`}
          </div>
        </div>
      )}
    </List>
  );
}
