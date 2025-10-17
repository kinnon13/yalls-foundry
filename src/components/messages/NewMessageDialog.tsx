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
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    onSuccess: (_, { recipientId }) => {
      toast({ title: 'Message sent' });
      onConversationCreated(recipientId);
      onOpenChange(false);
      setSearch('');
      setSelectedUser(null);
      setMessage('');
    },
    onError: (error) => {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Search for someone to start a conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or @handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : search.length >= 2 && users && users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No users found
            </p>
          ) : search.length >= 2 && users ? (
            <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => setSelectedUser(user.user_id)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-accent transition-colors ${
                    selectedUser === user.user_id ? 'bg-accent' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{user.display_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold">{user.display_name}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {/* Message input */}
          {selectedUser && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!selectedUser || !message.trim() || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
