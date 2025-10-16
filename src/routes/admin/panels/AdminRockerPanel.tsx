import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Lock } from 'lucide-react';
import { RockerChat } from '@/components/rocker/RockerChat';

export default function AdminRockerPanel() {
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
          
          <div className="h-[600px]">
            <RockerChat actorRole="admin" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
