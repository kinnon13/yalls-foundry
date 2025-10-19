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
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Apps (left) - highest z to ensure visibility */}
            <ResizablePanel defaultSize={35} minSize={20} maxSize={50} className="relative z-40">
              <AppsPane />
            </ResizablePanel>
            
            <ResizableHandle withHandle className="relative z-40" />
            
            {/* Reels/Feed (right) */}
            <ResizablePanel defaultSize={65} minSize={50} className="relative z-30 min-w-0">
              <div className="h-full w-full relative overflow-hidden">
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

