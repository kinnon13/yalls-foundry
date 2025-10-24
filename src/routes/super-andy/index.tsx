/**
 * Super Andy Intelligence Console - Unified Dashboard
 * All-in-one interface with voice, web search (Serper+XAI), learning metrics, and full system monitoring
 */

import { useState, useEffect } from 'react';
import { SuperAndyChat } from '@/components/super-andy/SuperAndyChat';
import { DocumentUpload } from '@/components/super-andy/DocumentUpload';
import { VoiceChat } from '@/components/super-andy/VoiceChat';
import { AndyBrain } from '@/components/super-andy/AndyBrain';
import { AndyMonitoring } from '@/components/super-andy/AndyMonitoring';
import { AndyBrainMonitor } from '@/components/super-andy/AndyBrainMonitor';
import { AndyLearningAssignment } from '@/components/super-andy/AndyLearningAssignment';
import { AndyMemoryViewer } from '@/components/super-andy/AndyMemoryViewer';
import { AndyRulesEditor } from '@/components/super-andy/AndyRulesEditor';
import { AndyStatusReport } from '@/components/super-andy/AndyStatusReport';
import { AndyCollections } from '@/components/super-andy/AndyCollections';
import { AndyResearchQueue } from '@/components/super-andy/AndyResearchQueue';
import { AndyCronSetup } from '@/components/super-andy/AndyCronSetup';
import { AndyThoughtStream } from '@/components/super-andy/AndyThoughtStream';
import { supabase } from '@/integrations/supabase/client';
import ProactiveRail from '@/pages/SuperAndy/ProactiveRail';
import SelfImproveLog from '@/pages/SuperAndy/SelfImproveLog';
import AndySystemsOverview from '@/pages/SuperAndy/AndySystemsOverview';
import { RockerActionsSidebar } from '@/components/rocker/RockerActionsSidebar';
import { ActionListener } from '@/components/rocker/ActionListener';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SuperAndyFull() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  return (
    <>
      <ActionListener filter="suggest." />
      <RockerActionsSidebar />
      <div className="grid grid-cols-[1fr_400px] gap-6 h-[calc(100vh-6rem)] p-6">
        <div className="flex flex-col">
          <div className="mb-4">
            <h1 className="text-3xl font-bold">Super Andy Intelligence Console</h1>
            <p className="text-muted-foreground">Voice-enabled AI with real-time web search (Serper + XAI Grok)</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <SuperAndyChat 
              threadId={activeThreadId} 
              onThreadCreated={setActiveThreadId}
            />
          </div>
        </div>
        
        <div className="space-y-6 overflow-y-auto">
          <Tabs defaultValue="live" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="live">🔴 Live</TabsTrigger>
              <TabsTrigger value="systems">Systems</TabsTrigger>
              <TabsTrigger value="monitor">Monitor</TabsTrigger>
              <TabsTrigger value="learn">Learn</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="live" className="space-y-4 mt-6">
              {userId && (
                <div className="bg-card rounded-lg border p-4">
                  <AndyThoughtStream userId={userId} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="systems" className="space-y-4 mt-6">
              <AndyStatusReport />
              <AndySystemsOverview />
            </TabsContent>

            <TabsContent value="monitor" className="space-y-6 mt-6">
              <AndyBrainMonitor />
              <AndyMonitoring />
            </TabsContent>

            <TabsContent value="learn" className="space-y-6 mt-6">
              <AndyCronSetup />
              <AndyRulesEditor />
              <AndyCollections />
              <AndyResearchQueue />
              <AndyMemoryViewer />
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
