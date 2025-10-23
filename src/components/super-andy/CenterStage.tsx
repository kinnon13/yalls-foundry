import { lazy, Suspense } from 'react';
import { AppId } from './AppDock';
import { SuperAndyKnowledge } from './SuperAndyKnowledge';
import { SuperAndyTasks } from './SuperAndyTasks';
import { UnifiedFilesMemory } from './UnifiedFilesMemory';
import { SuperAndyInbox } from './SuperAndyInbox';
import { SuperAndyAdmin } from './SuperAndyAdmin';
import { Calendar } from './Calendar';
import { ProactivePanel } from '@/components/rocker/ProactivePanel';
import { TasksView } from './TasksView';
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
      
      {activeApp === 'tasks' && <SuperAndyTasks threadId={threadId} />}
      
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
        <Suspense fallback={<LoadingState icon={Shield} label="Capabilities" />}>
          <SuperAdminCapabilities />
        </Suspense>
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
