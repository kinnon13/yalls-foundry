import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function BubbleRailTop() {
  const ref = useRef<HTMLDivElement>(null);
  
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await supabase.auth.getUser()).data.user
  });

  const { data: bubbles = [] } = useQuery({
    queryKey: ['bubbles', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // pinned + suggestions
      const { data = [] } = await supabase
        .from('entities')
        .select('id, display_name, kind, metadata')
        .limit(50);
      
      return data.map(e => ({
        id: e.id,
        name: e.display_name,
        avatar: (e.metadata as any)?.avatar_url || (e.metadata as any)?.logo_url
      }));
    }
  });

  // drag-to-scroll (desktop) + momentum
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let sx = 0;
    let sl = 0;

    const down = (e: MouseEvent) => {
      isDown = true;
      sx = e.pageX;
      sl = el.scrollLeft;
      el.classList.add('cursor-grabbing');
    };

    const up = () => {
      isDown = false;
      el.classList.remove('cursor-grabbing');
    };

    const move = (e: MouseEvent) => {
      if (!isDown) return;
      el.scrollLeft = sl - (e.pageX - sx);
    };

    el.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', move);

    return () => {
      el.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mousemove', move);
    };
  }, []);

  return (
    <div className="px-3 py-2 overflow-x-auto no-scrollbar">
      <div ref={ref} className="flex gap-3 cursor-grab select-none">
        {bubbles.concat(bubbles).map((b, i) => (
          <button key={b.id + '-' + i} className="flex-shrink-0 w-14">
            <span className="block h-14 w-14 rounded-full ring-2 ring-primary/60 overflow-hidden">
              {b.avatar ? (
                <img src={b.avatar} alt={b.name} className="h-full w-full object-cover" />
              ) : (
                <span className="h-full w-full grid place-items-center text-xs bg-muted">
                  {b.name?.slice(0, 2)}
                </span>
              )}
            </span>
            <span className="block mt-1 text-[10px] leading-tight line-clamp-2 opacity-80">
              {b.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
