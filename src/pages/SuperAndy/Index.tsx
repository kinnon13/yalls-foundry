/**
 * 🔒 PRODUCTION-LOCKED: Super Andy Console
 * Chat interface with proactive suggestions - DO NOT modify without approval
 */

import { useState } from 'react';
import { SuperAndyChat } from '@/components/super-andy/SuperAndyChat';
import { DocumentUpload } from '@/components/super-andy/DocumentUpload';
import { VoiceChat } from '@/components/super-andy/VoiceChat';
import { AndyBrain } from '@/components/super-andy/AndyBrain';
import { AndyMonitoring } from '@/components/super-andy/AndyMonitoring';
import { AndyBrainMonitor } from '@/components/super-andy/AndyBrainMonitor';
import { AndyLearningAssignment } from '@/components/super-andy/AndyLearningAssignment';
import ProactiveRail from './ProactiveRail';
import SelfImproveLog from './SelfImproveLog';
import { RockerActionsSidebar } from '@/components/rocker/RockerActionsSidebar';
import { ActionListener } from '@/components/rocker/ActionListener';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AndySystemsOverview from './AndySystemsOverview';

export default function SuperAndyPage() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  return (
    <>
      <ActionListener filter="suggest." />
      <RockerActionsSidebar />
      <div className="grid grid-cols-[1fr_400px] gap-6 h-[calc(100vh-6rem)]">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Super Andy Intelligence Console</h2>
          <div className="flex-1 overflow-hidden">
            <SuperAndyChat 
              threadId={activeThreadId} 
              onThreadCreated={setActiveThreadId}
            />
          </div>
        </div>
        
        <div className="space-y-6 overflow-y-auto">
          <Tabs defaultValue="systems" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="systems">Systems</TabsTrigger>
              <TabsTrigger value="monitor">Monitor</TabsTrigger>
              <TabsTrigger value="learn">Learn</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="systems" className="space-y-4 mt-6">
              <AndySystemsOverview />
            </TabsContent>

            <TabsContent value="monitor" className="space-y-6 mt-6">
              <AndyBrainMonitor />
              <AndyMonitoring />
            </TabsContent>

            <TabsContent value="learn" className="space-y-6 mt-6">
              <AndyLearningAssignment />
              <AndyBrain />
              <SelfImproveLog />
            </TabsContent>

            <TabsContent value="tools" className="space-y-6 mt-6">
              <VoiceChat />
              <DocumentUpload onAnalysisComplete={(analysis) => console.log('Doc analyzed:', analysis)} />
              <ProactiveRail />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
