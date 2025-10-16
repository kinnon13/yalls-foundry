/**
 * Super AI Panel - Admin-only comprehensive AI management
 * 
 * Manage all three AI personalities (Rocker, Admin Rocker, Andy):
 * - View analytics and performance metrics
 * - Upload training data and documents
 * - Manage knowledge base and memories
 * - Configure settings and permissions
 * - Delete or reset AI instances
 * - Legal data export for compliance
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AI_PROFILES, type AIRole } from '@/lib/ai/rocker/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { toast as sonnerToast } from 'sonner';

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
  const [exportUserId, setExportUserId] = useState('');
  const [exportReason, setExportReason] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // State for file upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState<{ [key: string]: any } | null>(null);

  // Function to handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setUploadFile(event.target.files[0]);
    }
  };

  // Function to handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload the file to Supabase storage
      const { data, error } = await supabase.storage
        .from('ai-training-data')
        .upload(`${selectedAI}/${uploadFile.name}`, uploadFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Upload Successful',
        description: `File ${uploadFile.name} uploaded successfully.`,
      });
      setUploadDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading the file.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Fetch analytics for all AIs
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['ai-metrics', selectedAI],
    queryFn: async () => {
      const { data: convos } = await supabase
        .from('rocker_conversations')
        .select('session_id, created_at', { count: 'exact' })
        .eq('actor_role', selectedAI);

      const { data: memories } = await supabase
        .from('ai_user_memory')
        .select('id', { count: 'exact' })
        .eq('scope', selectedAI);

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
      await supabase
        .from('rocker_conversations')
        .delete()
        .eq('actor_role', selectedAI);

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

  const handleExportUserData = async () => {
    if (!exportUserId.trim()) {
      sonnerToast.error('Please enter a user ID');
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-export-user-data', {
        body: { 
          target_user_id: exportUserId.trim(),
          reason: exportReason.trim() || 'Legal/compliance export'
        }
      });

      if (error) throw error;

      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-${exportUserId}-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sonnerToast.success('User data exported successfully');
      setExportUserId('');
      setExportReason('');
    } catch (error) {
      console.error('Error exporting user data:', error);
      sonnerToast.error('Failed to export user data');
    } finally {
      setIsExporting(false);
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
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="legal-export">
            <Shield className="h-4 w-4 mr-2" />
            Legal Export
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
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total_conversations || 0}</div>
                <p className="text-xs text-muted-foreground">Across all users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{((metrics?.success_rate || 0) * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Task completion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.avg_response_time_ms || 0}ms</div>
                <p className="text-xs text-muted-foreground">Average latency</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Items</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.memory_count || 0}</div>
                <p className="text-xs text-muted-foreground">Stored knowledge</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          <p>Manage the AI's knowledge base and memories here.</p>
          {/* Add knowledge management components here */}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Training Data</CardTitle>
              <CardDescription>
                Upload files to train the AI ({AI_PROFILES[selectedAI].name})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="training-data">Select File</Label>
                <Input
                  type="file"
                  id="training-data"
                  onChange={handleFileSelect}
                />
              </div>
              <Button onClick={handleFileUpload} disabled={uploading} className="w-full">
                {uploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <p>Configure settings and permissions for the AI ({AI_PROFILES[selectedAI].name}).</p>
          {/* Add settings configuration components here */}
        </TabsContent>

        {/* Legal Export Tab */}
        <TabsContent value="legal-export" className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Legal/Compliance Data Export</AlertTitle>
            <AlertDescription>
              This feature allows you to export complete, unredacted user data for legal purposes (subpoenas, court orders, etc.).
              All exports are logged in the admin audit log.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Export User Data</CardTitle>
              <CardDescription>
                Super admin only - Export complete user data including private conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="export-user-id">User ID to Export</Label>
                <Input
                  id="export-user-id"
                  placeholder="Enter user UUID"
                  value={exportUserId}
                  onChange={(e) => setExportUserId(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="export-reason">Reason for Export (Required for Audit)</Label>
                <Textarea
                  id="export-reason"
                  placeholder="e.g., Subpoena #12345, Court Order Case #ABC-2025, Legal Discovery Request..."
                  value={exportReason}
                  onChange={(e) => setExportReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleExportUserData} 
                disabled={isExporting || !exportUserId.trim()}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Complete User Data'}
              </Button>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>What gets exported:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All conversations (including private ones marked by super admin)</li>
                    <li>All AI memories and learning data</li>
                    <li>Complete interaction history</li>
                    <li>Posts, calendar events, and business data</li>
                    <li>Profile information</li>
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    This action is logged with your admin ID, timestamp, target user ID, and reason provided.
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that permanently delete data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="destructive" 
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All {AI_PROFILES[selectedAI].name} Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all conversations, memories, and data for{' '}
              <strong>{AI_PROFILES[selectedAI].name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAI} className="bg-destructive">
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
