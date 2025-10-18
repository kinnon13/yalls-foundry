import AppsPane from './parts/AppsPane';
import SocialFeedPane from './parts/SocialFeedPane';
import PhonePager from './parts/PhonePager';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { BottomDock } from '@/components/layout/BottomDock';

export default function HomePage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <GlobalHeader />

      {/* Split content: Left = Apps, Right = Feed */}
      <div className="flex-1 grid overflow-hidden lg:grid-cols-[minmax(560px,2fr)_minmax(420px,1fr)] md:grid-cols-[minmax(420px,1fr)_minmax(560px,2fr)] grid-cols-[1fr]">
        {/* Left: Apps — independent scroll */}
        <div className="hidden md:block overflow-y-auto overscroll-contain px-4 pb-24 pt-3">
          <AppsPane />
        </div>

        {/* Right: Feed — independent scroll */}
        <div className="hidden md:block overflow-y-auto overscroll-contain border-l border-border px-0 pb-24">
          <SocialFeedPane />
        </div>

        {/* Phone: horizontal pager (Apps | Feed | Shop | Profile) */}
        <div className="md:hidden h-full overflow-hidden">
          <PhonePager />
        </div>
      </div>

      <BottomDock />
    </div>
  );
}

