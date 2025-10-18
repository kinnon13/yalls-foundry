/**
 * Messaging App - iMessage-style chat
 */

import { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { NewConversationModal } from './NewConversationModal';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import { useRocker } from '@/lib/ai/rocker';

export default function MessagingApp() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const { log, section } = useRocker();

  useEffect(() => {
    log('page_view', { section: 'messaging' });
  }, [log]);

  return (
    <div className="flex h-screen bg-background">
      {/* Conversations sidebar */}
      <div className="w-80 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <h1 className="text-[15px] font-semibold">Messages</h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowNewConversation(true)}
            className="h-8 w-8"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </Button>
        </div>

        {/* List */}
        <ConversationList
          onSelect={setSelectedConversationId}
          selectedId={selectedConversationId}
        />
      </div>

      {/* Messages panel */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Messages */}
            <MessageList conversationId={selectedConversationId} />
            
            {/* Composer */}
            <Composer conversationId={selectedConversationId} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquarePlus className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No conversation selected</p>
              <Button onClick={() => setShowNewConversation(true)}>
                Start a new conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New conversation modal */}
      <NewConversationModal
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
        onConversationCreated={(id) => setSelectedConversationId(id)}
      />
    </div>
  );
}
