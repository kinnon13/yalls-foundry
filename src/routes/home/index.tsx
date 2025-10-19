import AppsPane from './parts/AppsPane';
import SocialFeedPane from './parts/SocialFeedPane';
import PhonePager from './parts/PhonePager';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { BottomDock } from '@/components/layout/BottomDock';
import DebugHUD from '@/dev/DebugHUD';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export default function HomePage() {
  return (
    <>
      <GlobalHeader />
      <main className="pt-14 pb-16 h-screen overflow-hidden">
        {/* Phone: horizontal pager (Apps | Feed | Shop | Profile) */}
        <div className="md:hidden h-[calc(100vh-56px-64px)] overflow-y-auto">
          <PhonePager />
        </div>

        {/* Tablet & Desktop */}
        <div className="hidden md:block h-[calc(100vh-56px-64px)] mx-auto max-w-[1600px]">
          <ResizablePanelGroup direction="horizontal" className="h-full hidden md:flex">
            {/* Apps (left) - resizable */}
            <ResizablePanel defaultSize={28} minSize={12} maxSize={50}>
              <AppsPane />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Reels (right) */}
            <ResizablePanel defaultSize={72} minSize={40}>
              <div className="h-full w-full flex justify-end items-start bg-black overflow-hidden">
                <SocialFeedPane />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </main>
      <BottomDock />
      {import.meta.env.DEV && <DebugHUD />}
    </>
  );
}

