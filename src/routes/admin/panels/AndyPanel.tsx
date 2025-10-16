import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Search, Users, MessageSquare, Database, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function AndyPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const queryClient = useQueryClient();

  // List users
  const { data: usersData } = useQuery({
    queryKey: ['andy-users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('andy-admin', {
        body: { action: 'list_users' },
      });
      if (error) throw error;
      return data;
    },
  });

  // View user details
  const viewUserMutation = useMutation({
    mutationFn: async ({ user_id, action }: { user_id: string; action: string }) => {
      if (!accessReason.trim()) {
        throw new Error('Access reason required');
      }

      const { data, error } = await supabase.functions.invoke('andy-admin', {
        body: { action, user_id, reason: accessReason },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Access logged');
      setAccessReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to access user data');
    },
  });

  const users = usersData?.users || [];
  const filteredUsers = users.filter((u: any) =>
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <CardTitle>Andy - Global Intelligence Layer</CardTitle>
          </div>
          <CardDescription>
            Aggregate knowledge across all users. Access requires audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="w-full">
            <TabsList>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="knowledge">
                <Database className="h-4 w-4 mr-2" />
                Global Knowledge
              </TabsTrigger>
              <TabsTrigger value="trends">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
            </TabsList>

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
                              <DialogTitle>Access User Data</DialogTitle>
                              <DialogDescription>
                                All access is logged for audit. Provide a reason for viewing this data.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Reason for access (required)..."
                                value={accessReason}
                                onChange={(e) => setAccessReason(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    viewUserMutation.mutate({
                                      user_id: user.user_id,
                                      action: 'view_profile',
                                    })
                                  }
                                  disabled={!accessReason.trim()}
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
                                  disabled={!accessReason.trim()}
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
                                  disabled={!accessReason.trim()}
                                  variant="outline"
                                >
                                  View Memories
                                </Button>
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

            <TabsContent value="knowledge">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Global knowledge aggregation coming soon. This will show anonymized patterns and
                    insights across all users.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Trend analysis coming soon. This will show usage patterns, popular features, and
                    behavioral insights.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
