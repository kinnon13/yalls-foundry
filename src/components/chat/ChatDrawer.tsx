import { X } from 'lucide-react';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  threadId?: string;
}

export function ChatDrawer({ open, onClose, threadId }: ChatDrawerProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed right-3 bottom-20 top-16 z-40 w-[90vw] max-w-[360px] rounded-xl border border-border bg-background/95 backdrop-blur shadow-lg flex flex-col animate-slide-in-right">
        {/* Header */}
        <header className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-medium">Messages</span>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-accent/40 grid place-items-center transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Thread list or messages */}
        <div className="flex-1 overflow-y-auto p-3">
          {threadId ? (
            // Single thread view
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground text-center py-8">
                Chat messages will appear here
              </div>
            </div>
          ) : (
            // Thread list
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground text-center py-8">
                Your conversations will appear here
              </div>
            </div>
          )}
        </div>

        {/* Message input */}
        <footer className="p-2 border-t">
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Message…"
          />
        </footer>
      </aside>
    </>
  );
}
