/**
 * New Message Dialog - Search users and start conversation
 */

import { useState } from 'react';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type NewMessageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (userId: string) => void;
};

export function NewMessageDialog({ open, onOpenChange, onConversationCreated }: NewMessageDialogProps) {
  const session = useSession();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-search', search],
    enabled: search.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .ilike('display_name', `%${search}%`)
        .neq('user_id', session!.session!.userId)
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  const sendMutation = useMutation({
    mutationFn: async ({ recipientId, body }: { recipientId: string; body: string }) => {
      const { error } = await (supabase.rpc as any)('dm_send', {
        p_recipient: recipientId,
        p_body: body,
        p_metadata: {}
      });
      if (error) throw error;
    },
    onSuccess: async (_, { recipientId }) => {
      // Log to Rocker for tracking new conversation creation
      await supabase.from('ai_action_ledger').insert({
        user_id: session!.session!.userId,
        agent: 'user',
        action: 'conversation_started',
        input: { recipient_id: recipientId, message_length: message.length },
        output: { success: true },
        result: 'success'
      });
      
      toast({ title: 'Message sent' });
      onConversationCreated(recipientId);
      onOpenChange(false);
      setSearch('');
      setSelectedUser(null);
      setMessage('');
    },
    onError: async (error) => {
      // Log failure to Rocker
      await supabase.from('ai_action_ledger').insert({
        user_id: session!.session!.userId,
        agent: 'user',
        action: 'conversation_start_failed',
        input: { recipient_id: selectedUser },
        output: { error: error instanceof Error ? error.message : 'Unknown error' },
        result: 'failure'
      });
      
      toast({
        title: 'Failed to send',
        description: error instanceof Error ? error.message : 'Could not send message',
        variant: 'destructive'
      });
    }
  });

  const handleSend = () => {
    if (!selectedUser || !message.trim()) return;
    sendMutation.mutate({ recipientId: selectedUser, body: message.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] backdrop-blur-xl bg-card/95 border-border/50 shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            New Message
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            Search for someone to start a conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search by name or @handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all h-11"
              autoFocus
            />
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : search.length >= 2 && users && users.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="mb-3 w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No users found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term</p>
            </div>
          ) : search.length >= 2 && users ? (
            <div className="border border-border/50 rounded-lg divide-y divide-border/50 max-h-[220px] overflow-y-auto shadow-inner bg-muted/20">
              {users.map((user, idx) => (
                <button
                  key={user.user_id}
                  onClick={() => setSelectedUser(user.user_id)}
                  className={cn(
                    'w-full p-3.5 flex items-center gap-3 transition-all duration-200 group',
                    'hover:bg-gradient-to-r hover:from-accent/60 hover:to-accent/30',
                    selectedUser === user.user_id && 'bg-gradient-to-r from-primary/10 to-primary/5 border-l-2 border-primary',
                    'animate-fade-in'
                  )}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <Avatar className="h-11 w-11 ring-2 ring-background shadow-md transition-transform group-hover:scale-105">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                      {user.display_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {user.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : search.length < 2 ? (
            <div className="text-center py-12 text-muted-foreground/60 text-sm">
              Type at least 2 characters to search
            </div>
          ) : null}

          {/* Message input */}
          {selectedUser && (
            <div className="space-y-2.5 animate-fade-in">
              <label className="text-sm font-semibold text-foreground">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full min-h-[110px] p-3.5 border border-border/50 rounded-lg resize-none bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="shadow-sm hover:shadow-md transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!selectedUser || !message.trim() || sendMutation.isPending}
              className="shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
