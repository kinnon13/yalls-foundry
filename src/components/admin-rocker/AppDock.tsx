import { Database, Brain, CheckSquare, FolderOpen, Users, BarChart3, Settings, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AppId = 
  | 'knowledge' 
  | 'tasks' 
  | 'files' 
  | 'analytics'
  | 'users'
  | 'settings'
  | 'chat';

interface AppDockProps {
  activeApp: AppId;
  onAppChange: (app: AppId) => void;
}

const APPS = [
  { id: 'knowledge' as AppId, label: 'Knowledge', icon: Brain, color: 'text-purple-500' },
  { id: 'tasks' as AppId, label: 'Tasks', icon: CheckSquare, color: 'text-blue-500' },
  { id: 'files' as AppId, label: 'Files', icon: FolderOpen, color: 'text-amber-500' },
  { id: 'users' as AppId, label: 'Users', icon: Users, color: 'text-green-500' },
  { id: 'analytics' as AppId, label: 'Analytics', icon: BarChart3, color: 'text-cyan-500' },
  { id: 'chat' as AppId, label: 'AI Chat', icon: MessageSquare, color: 'text-pink-500' },
  { id: 'settings' as AppId, label: 'Settings', icon: Settings, color: 'text-slate-500' },
];

export function AppDock({ activeApp, onAppChange }: AppDockProps) {
  return (
    <div className="flex lg:flex-col w-full h-full lg:p-3 p-2 gap-1 overflow-x-auto lg:overflow-y-auto">
      {APPS.map((app) => {
        const Icon = app.icon;
        const isActive = activeApp === app.id;
        
        return (
          <Button
            key={app.id}
            variant={isActive ? 'secondary' : 'ghost'}
            className={`
              flex-shrink-0 lg:flex-shrink lg:w-full justify-start gap-3 h-12
              ${isActive ? 'bg-secondary/80 shadow-sm' : 'hover:bg-secondary/50'}
              transition-all duration-200
            `}
            onClick={() => onAppChange(app.id)}
          >
            <Icon className={`h-5 w-5 ${isActive ? app.color : 'text-muted-foreground'}`} />
            <span className="hidden lg:inline text-sm font-medium">{app.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
