/**
 * ScreenSaver Component
 * Full-bleed overlay after idle timeout
 */

import { useState, useEffect } from 'react';

interface ScreenSaverProps {
  payload?: {
    mode?: 'single' | 'slideshow' | 'video';
    items?: Array<{ url: string }>;
    timeout?: number;
    showClock?: boolean;
  };
}

export function ScreenSaver({ payload }: ScreenSaverProps) {
  const [idle, setIdle] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!payload?.items || payload.items.length === 0) return;

    let timeoutId: NodeJS.Timeout;

    const reset = () => {
      setIdle(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIdle(true), (payload?.timeout ?? 45) * 1000);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(timeoutId);
    };
  }, [payload?.timeout, payload?.items]);

  // Update clock every second when active
  useEffect(() => {
    if (!idle || !payload?.showClock) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [idle, payload?.showClock]);

  if (!idle || !payload?.items || payload.items.length === 0) return null;

  const items = payload.items;
  const src =
    payload.mode === 'slideshow'
      ? items[(Math.floor(Date.now() / 5000)) % Math.max(items.length, 1)]?.url
      : items[0]?.url;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black cursor-pointer"
      onClick={() => setIdle(false)}
      role="button"
      tabIndex={0}
      aria-label="Exit screen saver"
    >
      {src && (
        <img
          src={src}
          className="w-full h-full object-cover opacity-90"
          alt=""
          loading="lazy"
        />
      )}
      {payload?.showClock && (
        <div className="absolute bottom-12 w-full text-center text-white/95 text-5xl font-medium drop-shadow-lg">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}
