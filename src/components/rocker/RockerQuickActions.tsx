import { Bookmark, Share2, Search, Upload, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickAction {
  icon: React.ElementType;
  label: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: Search, label: 'Find', prompt: 'Find that post about...' },
  { icon: Bookmark, label: 'Save', prompt: 'Save this post' },
  { icon: Share2, label: 'Share', prompt: 'Reshare this post' },
  { icon: Upload, label: 'Upload', prompt: 'Help me upload a photo' },
  { icon: Calendar, label: 'Event', prompt: 'Create a new event' }
];

interface RockerQuickActionsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function RockerQuickActions({ onSelectPrompt }: RockerQuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 border-b border-border">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            onClick={() => onSelectPrompt(action.prompt)}
            className="flex items-center gap-2"
          >
            <Icon className="h-3 w-3" />
            <span className="text-xs">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
