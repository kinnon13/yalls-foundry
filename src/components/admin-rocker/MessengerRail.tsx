import { RockerChatEmbedded } from '@/components/rocker/RockerChatEmbedded';
import { MessageSquare } from 'lucide-react';

interface MessengerRailProps {
  threadId: string | null;
}

export function MessengerRail({ }: MessengerRailProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Admin AI Chat</span>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <RockerChatEmbedded actorRole="admin" />
      </div>
    </div>
  );
}
