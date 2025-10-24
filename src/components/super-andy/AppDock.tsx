import { 
  Database, 
  Brain, 
  CheckSquare, 
  FolderOpen, 
  Inbox, 
  Shield,
  Key,
  Users,
  Calendar,
  Sparkles,
  GraduationCap,
  FileText,
  Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppId = 'knowledge' | 'files' | 'tasks' | 'task-os' | 'notebook' | 'inbox' | 'capabilities' | 'admin' | 'secrets' | 'calendar' | 'proactive' | 'training' | 'learn' | 'live';

interface AppDockProps {
  activeApp: AppId;
  onAppChange: (app: AppId) => void;
}

const APPS = [
  { id: 'live' as AppId, label: '🔴 Live Brain', icon: Radio, color: 'text-red-500' },
  { id: 'knowledge' as AppId, label: 'Knowledge', icon: Database, color: 'text-blue-500' },
  { id: 'files' as AppId, label: 'Files & Memory', icon: FolderOpen, color: 'text-purple-500' },
  { id: 'notebook' as AppId, label: 'Notebook', icon: FileText, color: 'text-teal-500' },
  { id: 'learn' as AppId, label: 'Learn', icon: Brain, color: 'text-violet-500' },
  { id: 'tasks' as AppId, label: 'Tasks (Old)', icon: CheckSquare, color: 'text-green-500' },
  { id: 'task-os' as AppId, label: 'Task OS', icon: CheckSquare, color: 'text-emerald-500' },
  { id: 'calendar' as AppId, label: 'Calendar', icon: Calendar, color: 'text-cyan-500' },
  { id: 'proactive' as AppId, label: 'Proactive', icon: Sparkles, color: 'text-yellow-500' },
  { id: 'inbox' as AppId, label: 'Inbox', icon: Inbox, color: 'text-pink-500' },
  { id: 'training' as AppId, label: 'Training', icon: GraduationCap, color: 'text-orange-500' },
  { id: 'capabilities' as AppId, label: 'Capabilities', icon: Shield, color: 'text-red-500' },
  { id: 'admin' as AppId, label: 'Andy Admin', icon: Users, color: 'text-indigo-500' },
  { id: 'secrets' as AppId, label: 'API Keys', icon: Key, color: 'text-amber-500' },
];

export function AppDock({ activeApp, onAppChange }: AppDockProps) {
  return (
    <div className="h-full flex flex-row lg:flex-col gap-1 lg:gap-2 p-2 lg:p-3 overflow-x-auto lg:overflow-x-visible">
      {APPS.map((app) => {
        const Icon = app.icon;
        const isActive = activeApp === app.id;
        
        return (
          <button
            key={app.id}
            onClick={() => onAppChange(app.id)}
            className={cn(
              'group relative flex flex-col items-center gap-2 p-2 lg:p-4 rounded-xl lg:rounded-2xl transition-all duration-200 shrink-0',
              isActive 
                ? 'bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10' 
                : 'hover:bg-muted/50'
            )}
            aria-label={app.label}
          >
            <div className={cn(
              'relative h-10 w-10 lg:h-12 lg:w-12 rounded-xl flex items-center justify-center transition-all duration-200',
              isActive 
                ? 'bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/25 lg:scale-110' 
                : 'bg-muted group-hover:bg-muted/80 group-hover:scale-105'
            )}>
              <Icon className={cn(
                'h-5 w-5 lg:h-6 lg:w-6 transition-colors duration-200',
                isActive ? 'text-primary-foreground' : app.color
              )} />
              {isActive && (
                <div className="absolute -bottom-1 h-1 w-6 rounded-full bg-primary" />
              )}
            </div>
            <span className={cn(
              'text-[10px] font-medium text-center leading-tight transition-colors duration-200 hidden lg:block',
              isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
            )}>
              {app.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
