import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppIconTile({
  icon: Icon,
  label,
  onClick,
  size = 112,
  className,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  size?: number;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        // glass + depth
        'relative grid place-items-center rounded-2xl border',
        'border-white/10 bg-white/[0.045]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_12px_32px_-14px_rgba(0,0,0,.55)]',
        'hover:bg-white/[0.08] active:scale-[.98] transition will-change-transform',
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* soft inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent" />
      {/* icon */}
      <Icon className="size-[28px] text-white/92" />
    </button>
  );
}
