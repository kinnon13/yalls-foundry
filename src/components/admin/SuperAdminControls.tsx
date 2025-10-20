/**
 * Super Admin Controls - Rocker Capability Toggles
 * CRITICAL: Only accessible to super_admin role
 * This is a completely separate control panel from regular admin
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Phone, Globe, Zap, Mail, Calendar, FileText, Users, DollarSign, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSuperAdminCheck } from '@/hooks/useSuperAdminCheck';
import { SystemStatsPanel } from './super-admin/SystemStatsPanel';
import { UserManagementPanel } from './super-admin/UserManagementPanel';
import { CalendarIntegrationPanel } from './super-admin/CalendarIntegrationPanel';
import { RuntimeFlagsPanel } from './super-admin/RuntimeFlagsPanel';

interface RockerSettings {
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

const CAPABILITIES = [
  {
    key: 'allow_secure_credentials' as keyof RockerSettings,
    label: 'Secure Credentials Storage',
    description: 'Allow Rocker to store and retrieve passwords and API keys',
    icon: Lock,
    color: 'text-red-500'
  },
  {
    key: 'allow_voice_calls' as keyof RockerSettings,
    label: 'Voice Calls',
    description: 'Allow Rocker to initiate phone calls via Twilio',
    icon: Phone,
    color: 'text-blue-500'
  },
  {
    key: 'allow_voice_messages' as keyof RockerSettings,
    label: 'Voice Messages',
    description: 'Allow Rocker to send voice messages',
    icon: Phone,
    color: 'text-blue-400'
  },
  {
    key: 'allow_web_automation' as keyof RockerSettings,
    label: 'Web Automation',
    description: 'Allow Rocker to automate web browsing and data extraction',
    icon: Globe,
    color: 'text-purple-500'
  },
  {
    key: 'allow_autonomous_actions' as keyof RockerSettings,
    label: 'Autonomous Actions',
    description: 'Allow Rocker to execute actions without approval',
    icon: Zap,
    color: 'text-yellow-500'
  },
  {
    key: 'allow_email_sending' as keyof RockerSettings,
    label: 'Email Sending',
    description: 'Allow Rocker to send emails on your behalf',
    icon: Mail,
    color: 'text-green-500'
  },
  {
    key: 'allow_calendar_access' as keyof RockerSettings,
    label: 'Calendar Access',
    description: 'Allow Rocker to read and modify your calendar',
    icon: Calendar,
    color: 'text-orange-500'
  },
  {
    key: 'allow_file_operations' as keyof RockerSettings,
    label: 'File Operations',
    description: 'Allow Rocker to create, read, and modify files',
    icon: FileText,
    color: 'text-indigo-500'
  },
  {
    key: 'allow_crm_operations' as keyof RockerSettings,
    label: 'CRM Operations',
    description: 'Allow Rocker to manage contacts and sales pipelines',
    icon: Users,
    color: 'text-pink-500'
  },
  {
    key: 'allow_financial_operations' as keyof RockerSettings,
    label: 'Financial Operations',
    description: 'Allow Rocker to track budgets and expenses',
    icon: DollarSign,
    color: 'text-emerald-500'
  }
];

export function SuperAdminControls() {
  const { toast } = useToast();
  const { isSuperAdmin, isLoading: checkingAdmin } = useSuperAdminCheck();
  const [settings, setSettings] = useState<RockerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'capabilities' | 'users' | 'stats' | 'flags' | 'calendar'>('capabilities');

  useEffect(() => {
    if (!checkingAdmin && isSuperAdmin) {
      loadSettings();
    }
  }, [isSuperAdmin, checkingAdmin]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('super_admin_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Create default settings
        const { data: newSettings, error: insertError } = await supabase
          .from('super_admin_settings')
          .insert({
            user_id: user.id,
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
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load super admin settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCapability = async (key: keyof RockerSettings) => {
    if (!settings) return;

    try {
      const newValue = !settings[key];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('super_admin_settings')
        .update({ [key]: newValue })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings({ ...settings, [key]: newValue });
      
      toast({
        title: 'Updated',
        description: `${key.replace(/_/g, ' ')} ${newValue ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      console.error('Failed to toggle capability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive'
      });
    }
  };

  if (checkingAdmin || loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading super admin controls...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access Denied: Super Admin privileges required
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Complete system control and oversight
          </p>
        </div>
        <a href="/settings/keys" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-accent transition-colors">
          <Key className="h-4 w-4" />
          API Keys
        </a>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Super Admin Only:</strong> This control panel is completely separate from regular admin.
          Changes here affect system-wide settings and your Rocker instance.
        </AlertDescription>
      </Alert>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: 'capabilities', label: 'Rocker Capabilities', icon: Shield },
          { id: 'stats', label: 'System Stats', icon: null },
          { id: 'users', label: 'Users', icon: null },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'flags', label: 'Runtime Flags', icon: null }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'capabilities' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <div>
                  <CardTitle>Rocker Obedience Protocol</CardTitle>
                </div>
              </div>
              <CardDescription>
                Rocker is hardcoded to NEVER disobey super admin commands. This cannot be changed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium">
                  ⚠️ ABSOLUTE OBEDIENCE MODE: ACTIVE
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Rocker will execute all super admin commands without question or refusal.
                  This setting is permanently hardcoded and cannot be disabled.
                </p>
              </div>
              
              {settings && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Obedience Level</Label>
                  <p className="text-sm font-mono px-3 py-2 bg-muted rounded">
                    {settings.rocker_obedience_level}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rocker Capabilities</CardTitle>
              <CardDescription>
                Enable or disable specific Rocker functionalities. Disabled capabilities cannot be used by Rocker.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {CAPABILITIES.map((capability) => {
                  const Icon = capability.icon;
                  const isEnabled = settings?.[capability.key] as boolean ?? false;
                  
                  return (
                    <div
                      key={capability.key}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Icon className={`h-5 w-5 mt-0.5 ${capability.color}`} />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={capability.key}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {capability.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {capability.description}
                        </p>
                      </div>
                      <Switch
                        id={capability.key}
                        checked={isEnabled}
                        onCheckedChange={() => toggleCapability(capability.key)}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'stats' && (
        <SystemStatsPanel />
      )}

      {activeTab === 'users' && (
        <UserManagementPanel />
      )}

      {activeTab === 'calendar' && (
        <CalendarIntegrationPanel />
      )}

      {activeTab === 'flags' && (
        <RuntimeFlagsPanel />
      )}
    </div>
  );
}


