import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AppBubble.css';

type AppBubbleProps = {
  to?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  title: string;
  meta?: string;
  badgeCount?: number;
  accent?: string;
  className?: string;
  'aria-label'?: string;
};

export function AppBubble({
  to,
  onClick,
  icon,
  title,
  meta,
  badgeCount,
  accent,
  className,
  ...a11y
}: AppBubbleProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [glare, setGlare] = useState<{ x: number; y: number }>({ x: 50, y: 20 });
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  const isReduced = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!ref.current || isReduced) return;
    const el = ref.current;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const max = 10;
      const ry = (px - 0.5) * (max * 2);
      const rx = -(py - 0.5) * (max * 2);

      setTilt({ rx, ry });
      setGlare({ x: px * 100, y: py * 100 });
    };

    const reset = () => {
      setTilt({ rx: 0, ry: 0 });
      setGlare({ x: 50, y: 20 });
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', reset);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', reset);
    };
  }, [isReduced]);

  const style: React.CSSProperties = {
    ...(accent ? { ['--bubble-accent' as any]: accent } : {}),
    transform: isReduced
      ? undefined
      : `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
  };

  const sheenStyle: React.CSSProperties = {
    background: `radial-gradient(180px 120px at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.35), rgba(255,255,255,0) 60%)`
  };

  const content = (
    <div ref={ref} className={`app-bubble ${className ?? ''}`} style={style} {...a11y}>
      <div className="app-bubble__inner">
        <div className="app-bubble__icon" aria-hidden>
          {icon}
        </div>
        <div>
          <div className="app-bubble__title">{title}</div>
          {meta && <div className="app-bubble__meta">{meta}</div>}
        </div>
      </div>

      {typeof badgeCount === 'number' && badgeCount > 0 && (
        <div className="app-bubble__badge" aria-label={`${badgeCount} updates`}>
          {badgeCount > 99 ? '99+' : badgeCount}
        </div>
      )}

      <div aria-hidden style={{ position:'absolute', inset:0, mixBlendMode:'screen', pointerEvents:'none', ...sheenStyle }} />
    </div>
  );

  if (to) {
    return <Link to={to} onClick={onClick} style={{ textDecoration: 'none' }}>{content}</Link>;
  }
  return <button onClick={onClick} style={{ all: 'unset', cursor: 'pointer', display: 'block' }}>{content}</button>;
}
