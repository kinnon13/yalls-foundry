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
        <div className="hidden md:block mx-auto max-w-[1600px] px-3 md:px-4">
          {/* Tablet: 1/3 apps | 2/3 feed — Desktop: 2/3 apps | 1/3 feed */}
          <div
            className="
              grid gap-4
              md:grid-cols-[minmax(320px,1fr)_minmax(480px,2fr)]
              xl:grid-cols-[minmax(720px,2fr)_minmax(420px,1fr)]
              items-start
            "
          >
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

