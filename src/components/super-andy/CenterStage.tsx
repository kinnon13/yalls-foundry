import { lazy, Suspense } from 'react';
import { AppId } from './AppDock';
import { SuperAndyKnowledge } from './SuperAndyKnowledge';
import { SuperAndyTasks } from './SuperAndyTasks';
import { AndyNotebook } from './AndyNotebook';
import { UnifiedFilesMemory } from './UnifiedFilesMemory';
import { SuperAndyInbox } from './SuperAndyInbox';
import { SuperAndyAdmin } from './SuperAndyAdmin';
import { Calendar } from './Calendar';
import { ProactivePanel } from '@/components/rocker/ProactivePanel';
import { TasksView } from './TasksView';
import { AndyCronSetup } from './AndyCronSetup';
import { AndyCollections } from './AndyCollections';
import { AndyResearchQueue } from './AndyResearchQueue';
import { AndyMemoryViewer } from './AndyMemoryViewer';
import { AndyRulesEditor } from './AndyRulesEditor';
import { Database, Brain, CheckSquare, FolderOpen, Inbox, Shield, Key, Calendar as CalendarIcon, Sparkles, GraduationCap } from 'lucide-react';

const SuperAdminCapabilities = lazy(() => 
  import('@/components/admin/SuperAdminControls').then(m => ({ default: m.SuperAdminControls }))
);
const SettingsKeysPage = lazy(() => import('@/pages/SettingsKeys'));
const TrainingDashboard = lazy(() => import('@/pages/Super/Training'));

interface CenterStageProps {
  activeApp: AppId;
  threadId: string | null;
}

export function CenterStage({ activeApp, threadId }: CenterStageProps) {
  const LoadingState = ({ icon: Icon, label }: { icon: any; label: string }) => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <Icon className="h-12 w-12 animate-pulse text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading {label}...</p>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full overflow-auto animate-fade-in">
      {activeApp === 'knowledge' && <SuperAndyKnowledge />}
      
      {activeApp === 'files' && <UnifiedFilesMemory />}
      
      {activeApp === 'learn' && (
        <div className="p-6 space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Brain className="w-6 h-6" />
              Andy's Learning Center
            </h2>
            <p className="text-sm text-muted-foreground">
              Memory collections, research queue, cron setup, custom rules, and learning metrics
            </p>
          </div>
          <AndyCronSetup />
          <AndyRulesEditor />
          <AndyCollections />
          <AndyResearchQueue />
          <AndyMemoryViewer />
        </div>
      )}
      
      {activeApp === 'tasks' && <SuperAndyTasks threadId={threadId} />}
      {activeApp === 'notebook' && <AndyNotebook />}
      
      {activeApp === 'task-os' && <TasksView />}
      
      {activeApp === 'calendar' && <Calendar />}
      
      {activeApp === 'proactive' && <ProactivePanel />}
      
      {activeApp === 'inbox' && <SuperAndyInbox />}
      
      {activeApp === 'training' && (
        <Suspense fallback={<LoadingState icon={GraduationCap} label="Training Dashboard" />}>
          <TrainingDashboard />
        </Suspense>
      )}
      
      {activeApp === 'capabilities' && (
        <div className="p-6">
          <div className="rounded-xl border border-border/40 bg-muted/30 p-6">
            <h3 className="text-lg font-semibold mb-1">Capabilities are managed in the Learn tab</h3>
            <p className="text-sm text-muted-foreground mb-3">
              To keep Andy’s rules and overrides centralized, this page is read‑only.
            </p>
            <a href="?app=learn" className="inline-flex items-center px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition">
              Go to Learn
            </a>
          </div>
        </div>
      )}
      
      {activeApp === 'admin' && <SuperAndyAdmin threadId={threadId} />}
      
      {activeApp === 'secrets' && (
        <Suspense fallback={<LoadingState icon={Key} label="API Keys" />}>
          <SettingsKeysPage />
        </Suspense>
      )}
    </div>
  );
}
