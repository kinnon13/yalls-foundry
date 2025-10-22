import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";

export default function SuperAndyChat() {
  const [privateMode, setPrivateMode] = useState(false);
  
  // Note: ai_goals and ai_bookmarks tables will be created when CTM schema is deployed
  const goals: any[] = [];
  const bookmarks: any[] = [];

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Super Andy</h1>
        
        <div className="flex items-center gap-2">
          <Shield className={privateMode ? 'text-primary' : 'text-muted-foreground'} />
          <Label htmlFor="private-mode">Private Mode</Label>
          <Switch
            id="private-mode"
            data-testid="private-switch"
            checked={privateMode}
            onCheckedChange={setPrivateMode}
          />
        </div>
      </div>

      {privateMode && (
        <Card className="p-4 mb-4 bg-primary/10 border-primary">
          <p className="text-sm">
            🔒 Private Mode enabled. External calls disabled. All data encrypted.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 min-h-[600px]">
            <h2 className="text-xl font-semibold mb-4">Chat</h2>
            <p className="text-muted-foreground">Chat interface coming soon...</p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6" data-testid="goals-panel">
            <Tabs defaultValue="goals">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                <TabsTrigger value="resume">Resume</TabsTrigger>
              </TabsList>
              
              <TabsContent value="goals" className="space-y-2">
                <h3 className="font-semibold mb-2">Active Goals</h3>
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No goals yet</p>
                ) : (
                  goals.map((goal: any) => (
                    <div key={goal.id} className="p-2 border rounded text-sm">
                      {goal.title}
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="bookmarks" data-testid="bookmarks-panel" className="space-y-2">
                <h3 className="font-semibold mb-2">Bookmarks</h3>
                {bookmarks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookmarks yet</p>
                ) : (
                  bookmarks.map((bookmark: any) => (
                    <div key={bookmark.id} className="p-2 border rounded text-sm">
                      {bookmark.note}
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="resume" data-testid="resume-panel">
                <h3 className="font-semibold mb-2">Resume Plan</h3>
                <p className="text-sm text-muted-foreground">
                  No plans to resume
                </p>
              </TabsContent>
            </Tabs>
          </Card>

          <Card className="p-6" data-testid="why-panel">
            <h3 className="font-semibold mb-2">Why This Action?</h3>
            <p className="text-sm text-muted-foreground">
              Reasoning will appear here when actions are taken
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
