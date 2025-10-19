import React from 'react';

interface SocialHeaderProps {
  name?: string;
  handle?: string;
  avatarUrl?: string;
}

export default function SocialHeader({ name = 'Kinnon Peck', handle = 'kinnonpeck13', avatarUrl }: SocialHeaderProps) {
  return (
    <header className="w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 text-[hsl(222.2_47.4%_11.2%)]">
      <div className="px-4 pt-3 pb-2 max-w-[820px] mx-auto">
        {/* Top row: profile views pill + actions */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            <span className="font-medium">6 profile views</span>
            <div className="flex -space-x-2">
              {[0,1,2].map((i) => (
                <div key={i} className="h-5 w-5 rounded-full bg-black/10 ring-2 ring-white" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 grid place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80">↗</button>
            <button className="h-9 w-9 grid place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80">≡</button>
          </div>
        </div>

        {/* Profile avatar */}
        <div className="mt-3 flex justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-white" />
          ) : (
            <div className="h-24 w-24 rounded-full bg-black/10 ring-4 ring-white" />
          )}
        </div>

        {/* Name + handle + Edit */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="text-center">
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-sm text-muted-foreground">@{handle}</div>
          </div>
          <button className="ml-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-muted/80">Edit</button>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Following', value: '3,963' },
            { label: 'Followers', value: '3,095' },
            { label: 'Likes', value: '32.3K' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-base font-semibold leading-none">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chips */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-muted/80">+ Add bio</button>
          <button className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-muted/80">+ Add school</button>
          <a className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-muted/80" href="#">instagram.com/{handle}</a>
        </div>

        {/* Lower nav */}
        <nav className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <a className="hover:text-foreground" href="#">TikTok Studio</a>
          <span className="opacity-40">|</span>
          <a className="hover:text-foreground" href="#">Your orders</a>
          <span className="opacity-40">|</span>
          <a className="hover:text-foreground" href="#">Showcase</a>
        </nav>
      </div>
    </header>
  );
}
