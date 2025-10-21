import { Suspense } from 'react';
import { AppId } from './AppDock';
import { 
  Home, BarChart3, Shield, Users, TrendingUp, 
  ScrollText, MessageCircle, Wrench, Brain, Settings 
} from 'lucide-react';
import { OverviewPanel } from './panels/OverviewPanel';
import { ModerationPanel } from './panels/ModerationPanel';
import { PromotionsPanel } from './panels/PromotionsPanel';
import { LogsPanel } from './panels/LogsPanel';
import { FeedbackPanel } from './panels/FeedbackPanel';
import { ToolsPanel } from './panels/ToolsPanel';
import { MemoryPanel } from './panels/MemoryPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { RoleManagementPanel } from '@/routes/admin/panels/RoleManagementPanel';
import AIAnalyticsPanel from '@/routes/admin/panels/AIAnalyticsPanel';

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
      {activeApp === 'overview' && <OverviewPanel />}
      
      {activeApp === 'analytics' && (
        <Suspense fallback={<LoadingState icon={BarChart3} label="Analytics" />}>
          <AIAnalyticsPanel />
        </Suspense>
      )}
      
      {activeApp === 'moderation' && <ModerationPanel />}
      
      {activeApp === 'users' && (
        <Suspense fallback={<LoadingState icon={Users} label="Users" />}>
          <RoleManagementPanel />
        </Suspense>
      )}
      
      {activeApp === 'promotions' && <PromotionsPanel />}
      
      {activeApp === 'logs' && <LogsPanel />}
      
      {activeApp === 'feedback' && <FeedbackPanel />}
      
      {activeApp === 'tools' && <ToolsPanel />}
      
      {activeApp === 'memory' && <MemoryPanel />}
      
      {activeApp === 'settings' && <SettingsPanel />}
    </div>
  );
}
