/**
 * Super Admin Settings Hook
 * Manages Rocker capability toggles for super admins
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminCheck } from './useSuperAdminCheck';

export interface SuperAdminSettings {
  allow_secure_credentials: boolean;
  allow_voice_calls: boolean;
  allow_voice_messages: boolean;
  allow_web_automation: boolean;
  allow_autonomous_actions: boolean;
  allow_email_sending: boolean;
  allow_calendar_access: boolean;
  allow_file_operations: boolean;
  allow_crm_operations: boolean;
  allow_financial_operations: boolean;
  rocker_obedience_level: string;
  rocker_can_refuse_commands: boolean;
}

export function useSuperAdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useSuperAdminCheck();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['super-admin-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('super_admin_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      // Return default settings if none exist
      if (!data) {
        return {
          allow_secure_credentials: false,
          allow_voice_calls: false,
          allow_voice_messages: false,
          allow_web_automation: false,
          allow_autonomous_actions: false,
          allow_email_sending: false,
          allow_calendar_access: false,
          allow_file_operations: false,
          allow_crm_operations: false,
          allow_financial_operations: false,
          rocker_obedience_level: 'absolute',
          rocker_can_refuse_commands: false
        };
      }

      return data as SuperAdminSettings;
    },
    enabled: isSuperAdmin
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: keyof SuperAdminSettings; value: boolean | string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('super_admin_settings')
        .upsert({
          user_id: user.id,
          [key]: value
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Super admin settings have been saved'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive'
      });
    }
  });

  return {
    settings,
    isLoading,
    updateSetting: updateSetting.mutate,
    isUpdating: updateSetting.isPending
  };
}
