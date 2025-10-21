import { lazy, Suspense } from 'react';
import { AppId } from './AppDock';
import { Brain, CheckSquare, FolderOpen, Users, BarChart3, Settings, MessageSquare } from 'lucide-react';

const KnowledgeBrowserPanel = lazy(() => import('@/routes/admin/panels/KnowledgeBrowserPanel'));
const AdminRockerPanel = lazy(() => import('@/routes/admin/panels/AdminRockerPanel'));
const RoleManagementPanel = lazy(() => 
  import('@/routes/admin/panels/RoleManagementPanel').then(m => ({ default: m.RoleManagementPanel }))
);
const AIAnalyticsPanel = lazy(() => import('@/routes/admin/panels/AIAnalyticsPanel'));

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
      {activeApp === 'knowledge' && (
        <Suspense fallback={<LoadingState icon={Brain} label="Knowledge" />}>
          <KnowledgeBrowserPanel />
        </Suspense>
      )}
      
      {activeApp === 'tasks' && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Admin Tasks - Coming Soon</p>
          </div>
        </div>
      )}
      
      {activeApp === 'files' && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">File Management - Coming Soon</p>
          </div>
        </div>
      )}
      
      {activeApp === 'users' && (
        <Suspense fallback={<LoadingState icon={Users} label="Users" />}>
          <RoleManagementPanel />
        </Suspense>
      )}
      
      {activeApp === 'analytics' && (
        <Suspense fallback={<LoadingState icon={BarChart3} label="Analytics" />}>
          <AIAnalyticsPanel />
        </Suspense>
      )}
      
      {activeApp === 'chat' && (
        <Suspense fallback={<LoadingState icon={MessageSquare} label="AI Chat" />}>
          <AdminRockerPanel />
        </Suspense>
      )}
      
      {activeApp === 'settings' && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Admin Settings - Coming Soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
