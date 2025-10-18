/**
 * Wallpaper Component
 * Always-on background for the Dashboard
 */

interface WallpaperProps {
  url?: string | null;
  blur?: number;
  dim?: number;
}

export function Wallpaper({ url, blur = 6, dim = 0.15 }: WallpaperProps) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <img
        src={url}
        className="w-full h-full object-cover"
        alt=""
        loading="lazy"
      />
      <div
        style={{ backdropFilter: `blur(${blur}px)` }}
        className="absolute inset-0"
      />
      <div
        style={{ backgroundColor: `rgba(0,0,0,${dim})` }}
        className="absolute inset-0"
      />
    </div>
  );
}
