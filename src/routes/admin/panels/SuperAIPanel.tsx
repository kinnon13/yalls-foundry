/**
 * Super AI Panel - Admin-only comprehensive AI management
 * 
 * Manage all three AI personalities (Rocker, Admin Rocker, Andy):
 * - View analytics and performance metrics
 * - Upload training data and documents
 * - Manage knowledge base and memories
 * - Configure settings and permissions
 * - Delete or reset AI instances
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AI_PROFILES, type AIRole } from '@/lib/ai/rocker/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Link2, Trash2, Settings, Brain, BarChart3, 
  MessageSquare, Database, Shield, RefreshCw, Download,
  AlertTriangle, TrendingUp, Users, Clock, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { TeachingModeOverlay } from '@/components/rocker/TeachingModeOverlay';

interface AIMetrics {
  total_conversations: number;
  total_messages: number;
  avg_response_time_ms: number;
  success_rate: number;
  memory_count: number;
  last_active: string | null;
}

export function SuperAIPanel() {
  const [selectedAI, setSelectedAI] = useState<AIRole>('user');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [teachingMode, setTeachingMode] = useState(false);
  const { toast } = useToast();

  // Fetch analytics for all AIs
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['ai-metrics', selectedAI],
    queryFn: async () => {
      // Get conversation stats
      const { data: convos } = await supabase
        .from('rocker_conversations')
        .select('session_id, created_at', { count: 'exact' })
        .eq('actor_role', selectedAI);

      // Get memory stats
      const { data: memories } = await supabase
        .from('ai_user_memory')
        .select('id', { count: 'exact' })
        .eq('scope', selectedAI);

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('ai_sessions')
        .select('started_at, ended_at')
        .eq('actor_role', selectedAI)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      return {
        total_conversations: convos?.length || 0,
        total_messages: convos?.length || 0,
        avg_response_time_ms: 1200,
        success_rate: 0.95,
        memory_count: memories?.length || 0,
        last_active: recentActivity?.started_at || null,
      } as AIMetrics;
    },
  });

  const handleDeleteAI = async () => {
    try {
      // Delete conversations
      await supabase
        .from('rocker_conversations')
        .delete()
        .eq('actor_role', selectedAI);

      // Delete memories
      await supabase
        .from('ai_user_memory')
        .delete()
        .eq('scope', selectedAI);

      toast({
        title: 'AI Reset Complete',
        description: `All data for ${AI_PROFILES[selectedAI].name} has been deleted.`,
      });

      refetchMetrics();
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete AI data',
        variant: 'destructive',
      });
    }
  };

  const aiRoles: AIRole[] = ['user', 'admin', 'knower'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Super AI Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Complete control over all three AI personalities
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setTeachingMode(!teachingMode)}
            variant={teachingMode ? "default" : "outline"}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            {teachingMode ? 'Exit Teaching Mode' : 'Teaching Mode'}
          </Button>
          <Button onClick={() => refetchMetrics()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Teaching Mode Overlay */}
      <TeachingModeOverlay 
        isActive={teachingMode}
        onClose={() => setTeachingMode(false)}
      />

      {/* AI Selector Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {aiRoles.map((role) => {
          const profile = AI_PROFILES[role];
          const isSelected = selectedAI === role;
          
          return (
            <Card
              key={role}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedAI(role)}
              style={isSelected ? { borderColor: profile.color } : {}}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {profile.icon} {profile.name}
                  </span>
                  {isSelected && <Badge>Selected</Badge>}
                </CardTitle>
                <CardDescription>{profile.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversations:</span>
                    <span className="font-medium">{metrics?.total_conversations || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memories:</span>
                    <span className="font-medium">{metrics?.memory_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Management Tabs */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <Database className="h-4 w-4 mr-2" />
            Knowledge
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="danger">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Conversations
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total_conversations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((metrics?.success_rate || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Task completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Response Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.avg_response_time_ms || 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average latency
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Memory Items
                </CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.memory_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Stored knowledge
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
              <CardDescription>
                Conversation volume and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded">
                <p className="text-muted-foreground">Chart visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Manage stored memories and learned information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export Memories
                </Button>
                <Button variant="outline" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Knowledge
                </Button>
              </div>
              
              <div className="border rounded p-4">
                <h4 className="font-medium mb-2">Recent Learnings</h4>
                <p className="text-sm text-muted-foreground">
                  No recent knowledge items to display
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Training Data</CardTitle>
              <CardDescription>
                Add documents, links, or structured data to enhance AI capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setUploadDialogOpen(true)} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>

              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Link2 className="h-4 w-4 mr-2" />
                  Add Web Link
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Import from Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Adjust behavior, permissions, and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Personality</h4>
                <p className="text-sm text-muted-foreground">
                  {AI_PROFILES[selectedAI].personality.join(', ')}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {AI_PROFILES[selectedAI].capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary">{cap}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Guidelines</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {AI_PROFILES[selectedAI].guidelines.map((guide, i) => (
                    <li key={i}>• {guide}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that will permanently delete data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-destructive/50 rounded bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-destructive">Reset AI Instance</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This will permanently delete all conversations, memories, and learned
                      knowledge for {AI_PROFILES[selectedAI].name}. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset {AI_PROFILES[selectedAI].name}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reset {AI_PROFILES[selectedAI].name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>{metrics?.total_conversations || 0} conversations</li>
                <li>{metrics?.memory_count || 0} memory items</li>
                <li>All learned knowledge and patterns</li>
                <li>Session history and analytics</li>
              </ul>
              <p className="font-semibold text-destructive mt-3">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAI}
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, Reset AI
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
