import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, MessageSquare, Brain, Lock, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { MessengerRail } from './MessengerRail';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface SuperRockerAdminProps {
  threadId: string | null;
}

export function SuperRockerAdmin({ threadId }: SuperRockerAdminProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // List users
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('rocker-admin', {
        body: { action: 'list_users' },
      });
      if (error) throw error;
      return data;
    },
  });

  // View user details
  const viewUserMutation = useMutation({
    mutationFn: async ({ user_id, action }: { user_id: string; action: string }) => {
      const { data, error } = await supabase.functions.invoke('rocker-admin', {
        body: { action, user_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Loaded');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to access user data');
    },
  });

  // Update privacy settings
  const updatePrivacyMutation = useMutation({
    mutationFn: async ({ user_id, settings }: { user_id: string; settings: any }) => {
      const { data, error } = await supabase.functions.invoke('rocker-admin', {
        body: { 
          action: 'update_privacy', 
          user_id,
          privacy_settings: settings
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Privacy settings updated");
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update privacy");
    }
  });

  const users = usersData?.users || [];
  const filteredUsers = users.filter((u: any) =>
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Andy - Super Admin Knowledge System
        </CardTitle>
        <CardDescription>
          Private super admin chat and user data management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Private Chat
            </TabsTrigger>
            <TabsTrigger value="users">
              <User className="h-4 w-4 mr-2" />
              User Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-accent/50 p-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Private Super Admin Chat</p>
                  <p className="text-xs text-muted-foreground">
                    Your conversations with Andy are completely private and stored securely. No other admins can access this data.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="h-[600px]">
              <MessengerRail threadId={threadId} />
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="secondary">{filteredUsers.length} users</Badge>
            </div>

            <ScrollArea className="h-[500px] border rounded-lg">
              <div className="p-4 space-y-2">
                {filteredUsers.map((user: any) => (
                  <Card key={user.user_id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{user.display_name || 'Anonymous'}</div>
                        <div className="text-sm text-muted-foreground">{user.bio}</div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{user.memory_count} memories</span>
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user.user_id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Access User Data - {user.display_name || 'Anonymous'}</DialogTitle>
                            <DialogDescription>
                              Super Admin access: no justification required.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={() =>
                                  viewUserMutation.mutate({
                                    user_id: user.user_id,
                                    action: 'view_profile',
                                  })
                                }
                              >
                                View Profile
                              </Button>
                              <Button
                                onClick={() =>
                                  viewUserMutation.mutate({
                                    user_id: user.user_id,
                                    action: 'view_conversations',
                                  })
                                }
                                variant="outline"
                              >
                                View Conversations
                              </Button>
                              <Button
                                onClick={() =>
                                  viewUserMutation.mutate({
                                    user_id: user.user_id,
                                    action: 'view_memories',
                                  })
                                }
                                variant="outline"
                              >
                                View Memories
                              </Button>
                            </div>

                            <div className="border-t pt-4 mt-4">
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Privacy Settings
                              </h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`hide-${user.user_id}`} className="text-sm">
                                    Hide from all admins
                                  </Label>
                                  <Switch
                                    id={`hide-${user.user_id}`}
                                    checked={user.privacy?.hidden_from_admins || false}
                                    onCheckedChange={(checked) => {
                                      updatePrivacyMutation.mutate({
                                        user_id: user.user_id,
                                        settings: {
                                          hidden_from_admins: checked,
                                          hidden_from_specific_admins: user.privacy?.hidden_from_specific_admins || []
                                        }
                                      });
                                    }}
                                  />
                                </div>
                                {user.privacy?.hidden_from_admins && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <ShieldOff className="h-3 w-3" />
                                    This user's data is hidden from all admins
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
