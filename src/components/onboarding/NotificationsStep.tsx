/**
 * Step 3: Notifications
 * Toggle in-app notifications
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Bell } from 'lucide-react';

interface NotificationsStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export function NotificationsStep({ onComplete, onBack }: NotificationsStepProps) {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExisting();
  }, []);

  const loadExisting = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('notifications_enabled')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile && profile.notifications_enabled !== null) {
      setEnabled(profile.notifications_enabled);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: enabled })
        .eq('user_id', user.id);

      if (error) throw error;

      onComplete();
    } catch (err) {
      console.error('[NotificationsStep] Save error:', err);
      alert('Failed to save notification preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
        <p className="text-muted-foreground">
          Get notified about important activity on your profile
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">In-App Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Get alerts for new messages, likes, comments, and follows
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            data-testid="notifications-toggle"
          />
        </div>

        <div className="text-xs text-muted-foreground pl-16">
          You can change this anytime in your settings. Native push notifications coming soon.
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
