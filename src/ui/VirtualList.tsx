/**
 * Virtual List for Performance
 * Handles 1000s of items efficiently
 */

import React, { useRef, useState, useEffect } from 'react';

export function VirtualList<T>({ 
  items, 
  row, 
  rowHeight 
}: {
  items: T[];
  row: (item: T, index: number) => React.ReactNode;
  rowHeight: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const onScroll = () => {
      setScrollTop(el.scrollTop);
      setHeight(el.clientHeight);
    };
    
    onScroll();
    el.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onScroll);
    
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const start = Math.floor(scrollTop / rowHeight);
  const visible = Math.ceil(height / rowHeight) + 5;
  const slice = items.slice(start, start + visible);

  return (
    <div ref={ref} style={{ overflow: 'auto', maxHeight: '70vh' }}>
      <div style={{ height: items.length * rowHeight, position: 'relative' }}>
        {slice.map((it, i) => (
          <div
            key={start + i}
            style={{
              position: 'absolute',
              top: (start + i) * rowHeight,
              left: 0,
              right: 0,
              height: rowHeight,
            }}
          >
            {row(it, start + i)}
          </div>
        ))}
      </div>
    </div>
  );
}
