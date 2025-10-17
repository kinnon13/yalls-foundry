/**
 * Messages Page - Direct messaging with conversations
 * Three-column: Conversations | Thread | Profile/Actions
 */

import { useState } from 'react';
import { useSession } from '@/lib/auth/context';
import { ConversationList } from '@/components/messages/ConversationList';
import { MessageThread } from '@/components/messages/MessageThread';
import { NewMessageDialog } from '@/components/messages/NewMessageDialog';
import { MessagesSidebar } from '@/components/messages/MessagesSidebar';

export default function Messages() {
  const session = useSession();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to view messages</p>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Left: Conversations List */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          onNewMessage={() => setNewMessageOpen(true)}
        />
      </div>

      {/* Center: Message Thread */}
      <div className="flex-1 min-w-0">
        <MessageThread conversationId={selectedConversationId} />
      </div>

      {/* Right: Sidebar (profile, actions) */}
      <div className="w-80 flex-shrink-0">
        <MessagesSidebar conversationId={selectedConversationId} />
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog
        open={newMessageOpen}
        onOpenChange={setNewMessageOpen}
        onConversationCreated={setSelectedConversationId}
      />
    </div>
  );
}
