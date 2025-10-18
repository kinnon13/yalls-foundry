/**
 * ChatDrawer - Slides over the right side for messaging
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[80] w-[90vw] sm:w-[420px] border-l border-border/40 bg-background shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="h-14 border-b border-border/40 flex items-center justify-between px-4 bg-background/80 backdrop-blur">
          <h2 className="font-semibold">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-56px)]">
          <div className="p-4 space-y-4">
            <div className="text-center text-muted-foreground py-12">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start a conversation!</p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
