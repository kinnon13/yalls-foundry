import { useEffect, useRef, useState } from 'react';

type Media = { url: string; type?: 'image' | 'video' };

export default function MediaFit({ m }: { m: Media }) {
  const ref = useRef<HTMLImageElement & HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [cls, setCls] = useState('object-cover');

  // Decide cover/contain based on natural aspect vs container aspect
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const set = () => {
      const cw = el.parentElement?.clientWidth ?? 1;
      const ch = el.parentElement?.clientHeight ?? 1;
      const containerAR = cw / ch;

      let w = 0, h = 0;
      // @ts-ignore
      if (el.videoWidth) {
        w = (el as HTMLVideoElement).videoWidth;
        h = (el as HTMLVideoElement).videoHeight;
      } else {
        w = (el as HTMLImageElement).naturalWidth;
        h = (el as HTMLImageElement).naturalHeight;
      }

      const mediaAR = (w || 1) / (h || 1);
      // For social we *prefer* cover. Only fall back to contain when the crop would be extreme
      const extremeCrop = mediaAR > containerAR * 2.2 || mediaAR * 2.2 < containerAR;
      setCls(extremeCrop ? 'object-contain bg-black' : 'object-cover');
      setReady(true);
    };

    if (m.type === 'video') {
      const v = el as HTMLVideoElement;
      if (v.readyState >= 2) set();
      else v.addEventListener('loadedmetadata', set, { once: true });
    } else {
      const img = el as HTMLImageElement;
      if (img.complete) set();
      else img.addEventListener('load', set, { once: true });
    }
  }, [m]);

  const common = `absolute inset-0 w-full h-full ${cls} transition-[object-position] duration-300`;
  
  return (
    <div className="absolute inset-0">
      {!ready && <div className="absolute inset-0 animate-pulse bg-muted/30" />}
      {m.type === 'video' ? (
        <video
          ref={ref as any}
          className={common}
          playsInline
          autoPlay
          muted
          loop
          preload="metadata"
          src={m.url}
        />
      ) : (
        <img ref={ref as any} className={common} alt="" src={m.url} />
      )}
    </div>
  );
}
