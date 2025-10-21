import { lazy, Suspense } from 'react';
import { AppId } from './AppDock';
import { SuperRockerKnowledge } from './SuperRockerKnowledge';
import { SuperRockerMemory } from './SuperRockerMemory';
import { SuperRockerTasks } from './SuperRockerTasks';
import { FileBrowser } from './FileBrowser';
import { SuperRockerInbox } from './SuperRockerInbox';
import { SuperRockerAdmin } from './SuperRockerAdmin';
import { Database, Brain, CheckSquare, FolderOpen, Inbox, Shield, Key } from 'lucide-react';

const SuperAdminCapabilities = lazy(() => 
  import('@/components/admin/SuperAdminControls').then(m => ({ default: m.SuperAdminControls }))
);
const SettingsKeysPage = lazy(() => import('@/pages/SettingsKeys'));

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
    <div className="h-full overflow-auto animate-fade-in">
      {activeApp === 'knowledge' && <SuperRockerKnowledge />}
      
      {activeApp === 'memory' && <SuperRockerMemory />}
      
      {activeApp === 'tasks' && <SuperRockerTasks threadId={threadId} />}
      
      {activeApp === 'files' && <FileBrowser />}
      
      {activeApp === 'inbox' && <SuperRockerInbox />}
      
      {activeApp === 'capabilities' && (
        <Suspense fallback={<LoadingState icon={Shield} label="Capabilities" />}>
          <SuperAdminCapabilities />
        </Suspense>
      )}
      
      {activeApp === 'admin' && <SuperRockerAdmin />}
      
      {activeApp === 'secrets' && (
        <Suspense fallback={<LoadingState icon={Key} label="API Keys" />}>
          <SettingsKeysPage />
        </Suspense>
      )}
    </div>
  );
}
