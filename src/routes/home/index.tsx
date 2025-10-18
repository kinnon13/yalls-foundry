import AppsPane from './parts/AppsPane';
import SocialFeedPane from './parts/SocialFeedPane';
import PhonePager from './parts/PhonePager';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { BottomDock } from '@/components/layout/BottomDock';

export default function HomePage() {
  return (
    <>
      <GlobalHeader />
      <main className="pt-14 pb-16">
        {/* Phone: horizontal pager (Apps | Feed | Shop | Profile) */}
        <div className="md:hidden">
          <PhonePager />
        </div>

        {/* Tablet & Desktop */}
        <div className="hidden md:grid h-[calc(100vh-112px)] gap-y-6 gap-x-0 px-6 mx-auto max-w-[1600px]
          md:grid-cols-[1fr_2fr] xl:grid-cols-[2fr_1fr]">
          {/* Apps (left) */}
          <div className="min-w-0 relative before:absolute before:right-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-primary/10 before:via-primary/30 before:to-primary/10">
            <AppsPane />
          </div>
          {/* Reels (right) - white background extends to right edge */}
          <div className="min-w-[360px] max-w-[560px] justify-self-end w-full bg-white relative after:absolute after:left-0 after:top-0 after:bottom-0 after:w-0.5 after:bg-gradient-to-b after:from-primary/10 after:via-primary/30 after:to-primary/10">
            <div className="absolute inset-y-0 -right-[100vw] w-[100vw] bg-white -z-10 pointer-events-none"></div>
            <SocialFeedPane />
          </div>
        </div>
      </main>
      <BottomDock />
    </>
  );
}

