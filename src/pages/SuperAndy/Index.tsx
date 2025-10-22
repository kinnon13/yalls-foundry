/**
 * Super Andy Main Page
 * Chat interface with proactive suggestions and self-improvement rails
 */

import { SuperAndyChat } from '@/components/super-andy/SuperAndyChat';
import ProactiveRail from './ProactiveRail';
import SelfImproveLog from './SelfImproveLog';

export default function SuperAndyPage() {
  return (
    <div className="grid grid-cols-[1fr_360px] gap-6 h-[calc(100vh-6rem)]">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Super Andy Chat</h2>
        <div className="flex-1 overflow-hidden">
          <SuperAndyChat threadId={null} />
        </div>
      </div>
      
      <div className="space-y-6 overflow-y-auto">
        <ProactiveRail />
        <SelfImproveLog />
      </div>
    </div>
  );
}
