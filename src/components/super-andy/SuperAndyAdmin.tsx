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
import { Search, User, MessageSquare, Brain, Lock, Shield, ShieldOff, Sparkles, Settings, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { MessengerRail } from './MessengerRail';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PersonaSettings } from './PersonaSettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SuperAndyAdminProps {
  threadId: string | null;
}

export function SuperAndyAdmin({ threadId }: SuperAndyAdminProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [cronSchedules, setCronSchedules] = useState({
    perceive: '0 * * * *', // hourly
    improve: '0 0 * * *', // daily
    expandMemory: '0 */6 * * *', // every 6h
  });
  
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

  // Update model selection
  const updateModelMutation = useMutation({
    mutationFn: async (model: string) => {
      const { data, error } = await supabase.functions.invoke('andy-admin', {
        body: { action: 'set_model', model }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Model updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update model");
    }
  });

  // Manage cron jobs
  const manageCronMutation = useMutation({
    mutationFn: async ({ job, schedule, enabled }: { job: string; schedule?: string; enabled?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('andy-admin', {
        body: { action: 'manage_cron', job, schedule, enabled }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Cron job updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update cron");
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Private Chat
            </TabsTrigger>
            <TabsTrigger value="users">
              <User className="h-4 w-4 mr-2" />
              User Data
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings className="h-4 w-4 mr-2" />
              Model & Cron
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Sparkles className="h-4 w-4 mr-2" />
              Settings
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

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    AI Model Selection
                  </CardTitle>
                  <CardDescription>Choose which model Andy uses (live changes)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Active Model</Label>
                    <Select value={selectedModel} onValueChange={(val) => {
                      setSelectedModel(val);
                      updateModelMutation.mutate(val);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (default)</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (best reasoning)</SelectItem>
                        <SelectItem value="gpt-5">GPT-5 (powerful)</SelectItem>
                        <SelectItem value="gpt-5-mini">GPT-5 Mini (balanced)</SelectItem>
                        <SelectItem value="grok-2">Grok-2 (xAI)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Grok requires GROK_API_KEY secret in backend
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Automatic Learning (Cron Jobs)
                  </CardTitle>
                  <CardDescription>Live control - changes take effect immediately</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">Perceive Tick</p>
                        <p className="text-sm text-muted-foreground">Scan for learning opportunities</p>
                        <p className="text-xs text-muted-foreground mt-1">Schedule: {cronSchedules.perceive}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          manageCronMutation.mutate({ job: 'perceive', enabled: true });
                        }}>
                          Enable
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          manageCronMutation.mutate({ job: 'perceive', enabled: false });
                        }}>
                          Disable
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">Self-Improve Tick</p>
                        <p className="text-sm text-muted-foreground">Auto-tweak based on feedback</p>
                        <p className="text-xs text-muted-foreground mt-1">Schedule: {cronSchedules.improve}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          manageCronMutation.mutate({ job: 'improve', enabled: true });
                        }}>
                          Enable
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          manageCronMutation.mutate({ job: 'improve', enabled: false });
                        }}>
                          Disable
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">Expand Memory</p>
                        <p className="text-sm text-muted-foreground">Consolidate and expand memories</p>
                        <p className="text-xs text-muted-foreground mt-1">Schedule: {cronSchedules.expandMemory}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          manageCronMutation.mutate({ job: 'expand_memory', enabled: true });
                        }}>
                          Enable
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          manageCronMutation.mutate({ job: 'expand_memory', enabled: false });
                        }}>
                          Disable
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Manual Cron Setup (Backend SQL)</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Open backend → SQL Editor → Run:
                    </p>
                    <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`SELECT cron.schedule(
  'andy-perceive-hourly',
  '0 * * * *',
  $$SELECT net.http_post(
    url:='https://xuxfuonzsfvrirdwzddt.supabase.co/functions/v1/super-andy-perceive',
    headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) as request_id;$$
);`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <PersonaSettings />
            </TabsContent>
          </Tabs>
      </CardContent>
    </Card>
  );
}
