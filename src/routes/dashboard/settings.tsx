import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppearancePanel } from '@/components/appearance/AppearancePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardSettings() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  if (!userId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
      <p className="text-muted-foreground mb-6">Configure your preferences</p>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6 pt-6">
          <AppearancePanel subjectType="user" subjectId={userId} />
        </TabsContent>

        <TabsContent value="notifications" className="pt-6">
          <p className="text-muted-foreground">Notification settings coming soon...</p>
        </TabsContent>

        <TabsContent value="privacy" className="pt-6">
          <p className="text-muted-foreground">Privacy settings coming soon...</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
