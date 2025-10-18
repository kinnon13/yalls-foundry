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
    <div className="bubble-rail">
      <div ref={ref} className="bubble-track">
        {bubbles.concat(bubbles).map((b, i) => (
          <button key={b.id + '-' + i} className="bubble">
            {b.avatar ? (
              <img src={b.avatar} alt={b.name} />
            ) : (
              <div className="w-14 h-14 rounded-full grid place-items-center text-xs bg-muted border-2 border-border/10">
                {b.name?.slice(0, 2)}
              </div>
            )}
            <span className="bubble-name">{b.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
