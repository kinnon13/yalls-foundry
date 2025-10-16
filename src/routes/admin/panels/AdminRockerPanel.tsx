import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Lock, Shield } from 'lucide-react';
import { RockerChatEmbedded } from '@/components/rocker/RockerChatEmbedded';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function AdminRockerPanel() {
  const queryClient = useQueryClient();

  // Get current user's privacy settings
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    }
  });

  const { data: privacyData } = useQuery({
    queryKey: ['admin-privacy', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('ai_user_privacy')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!session?.user?.id
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: async (settings: any) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('ai_user_privacy')
        .upsert({
          user_id: session.user.id,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Privacy settings updated");
      queryClient.invalidateQueries({ queryKey: ['admin-privacy'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update privacy");
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin Rocker - Team AI Assistant
          </CardTitle>
          <CardDescription>
            Train and interact with the admin-level AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-accent/50 p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Private Admin Chat</p>
                <p className="text-xs text-muted-foreground">
                  Your conversations with Admin Rocker are private to you. Knowledge learned here can be promoted to platform-wide via the Promotions panel.
                </p>
              </div>
            </div>
          </div>

          {!privacyData?.managed_by_super_admin && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="hide-from-admins" className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Hide from other admins
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Prevent other admins from viewing your conversations and memories
                  </p>
                </div>
                <Switch
                  id="hide-from-admins"
                  checked={privacyData?.hidden_from_admins || false}
                  onCheckedChange={(checked) => {
                    updatePrivacyMutation.mutate({
                      hidden_from_admins: checked,
                      hidden_from_specific_admins: privacyData?.hidden_from_specific_admins || []
                    });
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="h-[600px]">
            <RockerChatEmbedded actorRole="admin" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
