import AppsPane from './parts/AppsPane';
import SocialFeedPane from './parts/SocialFeedPane';
import PhonePager from './parts/PhonePager';
import WorkspaceHost from './parts/WorkspaceHost';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { BottomDock } from '@/components/layout/BottomDock';

export default function HomePage() {
  return (
    // Full-viewport shell; body must not scroll
    <div className="fixed inset-0 grid grid-rows-[64px_1fr_56px] bg-background">
      <GlobalHeader />

      {/* Content area: NO outer scroll */}
      <div
        className="
          grid h-full overflow-hidden
          lg:grid-cols-[minmax(320px,2fr)_minmax(280px,1fr)]
          md:grid-cols-[minmax(280px,1fr)_minmax(320px,2fr)]
          grid-cols-1
        "
      >
        {/* Left: Apps (desktop/tablet) — independent scroll */}
        <div className="overflow-y-auto overscroll-contain px-4 pb-24 pt-3">
          <AppsPane />
        </div>

        {/* Right: Feed (desktop/tablet) — independent scroll */}
        <div className="hidden md:block h-full overflow-y-auto overscroll-contain border-l border-border px-0 pb-24">
          <SocialFeedPane />
        </div>

        {/* Phone: horizontal pager */}
        <div className="md:hidden h-full overflow-hidden">
          <PhonePager />
        </div>
      </div>

      {/* Always on top of the grid */}
      <WorkspaceHost />

      <BottomDock />
    </div>
  );
}
