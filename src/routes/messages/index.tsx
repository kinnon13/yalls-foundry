/**
 * Messages Page - Direct messaging with conversations
 * Three-column: Conversations | Thread | Profile/Actions
 */

import { useState } from 'react';
import { useSession } from '@/lib/auth/context';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { ConversationList } from '@/components/messages/ConversationList';
import { MessageThread } from '@/components/messages/MessageThread';
import { NewMessageDialog } from '@/components/messages/NewMessageDialog';
import { MessagesSidebar } from '@/components/messages/MessagesSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/design/components/Button';
import { ArrowLeft, Info } from 'lucide-react';

export default function Messages() {
  const session = useSession();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const isMobile = useIsMobile();

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to view messages</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <div className="h-[calc(100vh-64px)] flex gap-3 md:gap-6 p-3 md:p-6 bg-gradient-to-br from-background via-background to-muted/20">
        {/* Mobile: Single panel view */}
        {isMobile ? (
          <>
            {!selectedConversationId && !showSidebar && (
              <div className="flex-1">
                <ConversationList
                  selectedId={selectedConversationId}
                  onSelect={setSelectedConversationId}
                  onNewMessage={() => setNewMessageOpen(true)}
                />
              </div>
            )}
            
            {selectedConversationId && !showSidebar && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="ghost"
                    size="s"
                    onClick={() => setSelectedConversationId(null)}
                  >
                    <ArrowLeft size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="s"
                    onClick={() => setShowSidebar(true)}
                    className="ml-auto"
                  >
                    <Info size={20} />
                  </Button>
                </div>
                <div className="flex-1">
                  <MessageThread conversationId={selectedConversationId} />
                </div>
              </div>
            )}
            
            {showSidebar && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant="ghost"
                    size="s"
                    onClick={() => setShowSidebar(false)}
                  >
                    <ArrowLeft size={20} />
                  </Button>
                </div>
                <div className="flex-1">
                  <MessagesSidebar conversationId={selectedConversationId} />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Desktop/Tablet: Multi-column view */}
            <div className="w-[280px] lg:w-[340px] flex-shrink-0">
              <ConversationList
                selectedId={selectedConversationId}
                onSelect={setSelectedConversationId}
                onNewMessage={() => setNewMessageOpen(true)}
              />
            </div>

            <div className="flex-1 min-w-0">
              <MessageThread conversationId={selectedConversationId} />
            </div>

            <div className="hidden lg:block w-[340px] flex-shrink-0">
              <MessagesSidebar conversationId={selectedConversationId} />
            </div>
          </>
        )}

        <NewMessageDialog
          open={newMessageOpen}
          onOpenChange={setNewMessageOpen}
          onConversationCreated={setSelectedConversationId}
        />
      </div>
    </div>
  );
}
