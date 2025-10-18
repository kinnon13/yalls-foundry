/**
 * NewConversationModal - Start a new conversation
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
}

export function NewConversationModal({
  open,
  onOpenChange,
  onConversationCreated,
}: NewConversationModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      // Search profiles
      let query = supabase
        .from('profiles' as any)
        .select('id, user_id, display_name, avatar_url')
        .limit(20);

      if (search) {
        query = query.ilike('display_name', `%${search}%`);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: open,
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts', search],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return [];

      let query = supabase
        .from('contacts' as any)
        .select('id, full_name, email')
        .eq('owner_user_id', session.session.user.id)
        .limit(20);

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const participantIds = [session.session.user.id, ...selected];

      const { data, error } = await supabase.rpc('create_conversation' as any, {
        p_user_ids: participantIds,
        p_type: selected.length > 1 ? 'group' : 'direct',
      });

      if (error) throw error;
      return String(data);
    },
    onSuccess: (conversationId: string) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onConversationCreated(conversationId);
      onOpenChange(false);
      setSelected([]);
      setSearch('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to create conversation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  const toggleUser = (userId: string) => {
    setSelected(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search people or contacts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected count */}
          {selected.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selected.length} participant{selected.length > 1 ? 's' : ''} selected
            </p>
          )}

          {/* Users list */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {users?.map((user: any) => (
              <button
                key={user.user_id}
                onClick={() => toggleUser(user.user_id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left",
                  selected.includes(user.user_id) && "bg-muted"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {user.display_name?.[0] || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground">User</p>
                </div>
              </button>
            ))}

            {contacts?.map((contact: any) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{contact.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">Contact</p>
              </div>
            ))}

            {(!users || users.length === 0) && (!contacts || contacts.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No results found
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={selected.length === 0 || createMutation.isPending}
            >
              Start Chat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
