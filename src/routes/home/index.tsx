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
        {/* Phone: horizontal pager with 4 screens */}
        <div className="md:hidden">
          <PhonePager />
        </div>

        {/* Tablet & Desktop: grid */}
        <div className="hidden md:grid mx-auto max-w-[1400px] gap-4 px-3 md:px-4">
          {/* Tablet: 1/3 apps (left) | 2/3 feed (right) */}
          {/* Desktop: 2/3 apps (left) | 1/3 feed (right) */}
          <div className="
            grid gap-4
            md:grid-cols-[1fr_2fr]
            xl:grid-cols-[2fr_1fr]
          ">
            <section aria-label="Apps" className="min-h-[calc(100vh-14rem)]">
              <AppsPane />
            </section>
            <aside aria-label="Social Feed" className="min-h-[calc(100vh-14rem)]">
              <SocialFeedPane />
            </aside>
          </div>
        </div>
      </main>
      <BottomDock />
    </>
  );
}
