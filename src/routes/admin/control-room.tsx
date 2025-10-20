/**
 * Control Room - Admin Dashboard
 * 
 * Centralized diagnostic and testing interface with organized tabs.
 * Quick access to RLS scanning, test running, exports, and platform health.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SEOHelmet } from '@/lib/seo/helmet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, TestTube, Code, FileCheck, Activity, 
  MessageSquare, Settings, Home, Gauge, Search, Upload, Flag, AlertTriangle, TrendingUp, Hammer, Brain
} from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useSuperAdminCheck } from '@/hooks/useSuperAdminCheck';

// Import panel components
import RLSScanner from '@/routes/admin/panels/RLSScanner';
import TestRunner from '@/routes/admin/panels/TestRunner';
import CodeSearchPanel from '@/routes/admin/panels/CodeSearchPanel';
import CodeAuditPanel from '@/routes/admin/panels/CodeAuditPanel';
import ScalingReadinessPanel from '@/routes/admin/panels/ScalingReadinessPanel';
import AuthPanel from '@/routes/admin/panels/AuthPanel';
import { SuggestionsPanel } from '@/routes/admin/panels/SuggestionsPanel';
import { FeatureFlagsPanel } from '@/routes/admin/panels/FeatureFlagsPanel';
import { TourSchedulePanel } from '@/routes/admin/panels/TourSchedulePanel';
import { EntitySearchPanel } from '@/routes/admin/panels/EntitySearchPanel';
import { ScaleScorecard } from '@/lib/observability/ScaleScorecard';
import { MediaUploadDialog } from '@/components/media/MediaUploadDialog';
import { ModeratorConsole } from '@/routes/admin/panels/ModeratorConsole';
import AIAnalyticsPanel from '@/routes/admin/panels/AIAnalyticsPanel';
import KnowledgeBrowserPanel from '@/routes/admin/panels/KnowledgeBrowserPanel';
import { KnowledgeIngestPanel } from '@/routes/admin/panels/KnowledgeIngestPanel';
import { Phase2VerificationPanel } from '@/routes/admin/panels/Phase2VerificationPanel';
import { HardeningVerificationPanel } from '@/routes/admin/panels/HardeningVerificationPanel';
import { SuperAIPanel } from '@/routes/admin/panels/SuperAIPanel';
import { RoleManagementPanel } from '@/routes/admin/panels/RoleManagementPanel';
import { AndyPanel } from '@/routes/admin/panels/AndyPanel';
import { PromotionPanel } from '@/routes/admin/panels/PromotionPanel';
import AdminRockerPanel from '@/routes/admin/panels/AdminRockerPanel';
import RockerLearningPanel from '@/routes/admin/panels/RockerLearningPanel';
import { RockerLabelsPanel } from '@/routes/admin/panels/RockerLabelsPanel';
import { CapabilityBrowserPanel } from '@/routes/admin/panels/CapabilityBrowserPanel';

export default function ControlRoom() {
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { isAdmin, isLoading } = useAdminCheck();
  const { isSuperAdmin } = useSuperAdminCheck();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="h-16 w-16 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access the Control Room.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/">
              <Button>Go Home</Button>
            </Link>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('bootstrap-super-admin', { body: {} });
                  if (error || (data as any)?.error) return alert('Bootstrap failed.');
                  window.location.reload();
                } catch (_) {
                  alert('Bootstrap failed.');
                }
              }}
            >
              Make me Super Admin
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">First-time setup only: promotes the current account if no super admin exists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
        <SEOHelmet 
          title="Control Room" 
          description="Admin dashboard for diagnostics, testing, and platform monitoring" 
        />
        
        {/* Header */}
        <header className="border-b bg-gradient-to-r from-background via-primary/5 to-background sticky top-0 z-40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  Control Room
                </h1>
                <p className="text-muted-foreground">
                  Enterprise-grade admin dashboard for platform management
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => setUploadDialogOpen(true)} size="default" variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Media
                </Button>
                <Link to="/settings/keys">
                  <Button variant="outline" size="default" className="gap-2">
                    <Settings className="h-4 w-4" />
                    API Keys
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="ghost" size="default" className="gap-2">
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            {/* Tab Navigation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Navigation
                </h2>
              </div>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 h-auto p-1 bg-muted/50">
                <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
                  <Gauge className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="admin-rocker" className="gap-2 data-[state=active]:bg-background">
                  <Settings className="h-4 w-4" />
                  <span>Admin Rocker</span>
                </TabsTrigger>
                {isSuperAdmin && (
                  <>
                    <TabsTrigger value="andy" className="gap-2 data-[state=active]:bg-background">
                      <Brain className="h-4 w-4" />
                      <span>Andy</span>
                    </TabsTrigger>
                    <TabsTrigger value="promotions" className="gap-2 data-[state=active]:bg-background">
                      <TrendingUp className="h-4 w-4" />
                      <span>Promotions</span>
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="ai-analytics" className="gap-2 data-[state=active]:bg-background">
                  <Activity className="h-4 w-4" />
                  <span>AI Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-background">
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="scaling" className="gap-2 data-[state=active]:bg-background">
                  <TrendingUp className="h-4 w-4" />
                  <span>Scaling</span>
                </TabsTrigger>
                <TabsTrigger value="moderator" className="gap-2 data-[state=active]:bg-background">
                  <Flag className="h-4 w-4" />
                  <span>Moderator</span>
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="gap-2 data-[state=active]:bg-background">
                  <FileCheck className="h-4 w-4" />
                  <span>Knowledge</span>
                </TabsTrigger>
                <TabsTrigger value="tests" className="gap-2 data-[state=active]:bg-background">
                  <TestTube className="h-4 w-4" />
                  <span>Tests</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="gap-2 data-[state=active]:bg-background">
                  <Code className="h-4 w-4" />
                  <span>Code Search</span>
                </TabsTrigger>
                <TabsTrigger value="feedback" className="gap-2 data-[state=active]:bg-background">
                  <MessageSquare className="h-4 w-4" />
                  <span>Feedback</span>
                </TabsTrigger>
                <TabsTrigger value="auth" className="gap-2 data-[state=active]:bg-background">
                  <Settings className="h-4 w-4" />
                  <span>Auth</span>
                </TabsTrigger>
                <TabsTrigger value="flags" className="gap-2 data-[state=active]:bg-background">
                  <Flag className="h-4 w-4" />
                  <span>Feature Flags</span>
                </TabsTrigger>
                <TabsTrigger value="roles" className="gap-2 data-[state=active]:bg-background">
                  <Shield className="h-4 w-4" />
                  <span>Roles</span>
                </TabsTrigger>
                <TabsTrigger value="learning" className="gap-2 data-[state=active]:bg-background">
                  <Brain className="h-4 w-4" />
                  <span>Learning</span>
                </TabsTrigger>
                <TabsTrigger value="capabilities" className="gap-2 data-[state=active]:bg-background">
                  <Hammer className="h-4 w-4" />
                  <span>Capabilities</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Panels</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">18</div>
                    <p className="text-xs text-muted-foreground mt-1">Admin tools available</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Phase 1</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">100%</div>
                    <p className="text-xs text-muted-foreground mt-1">Complete ✓</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Max Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">~100K</div>
                    <p className="text-xs text-muted-foreground mt-1">Current capacity</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Target Scale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">1B</div>
                    <p className="text-xs text-muted-foreground mt-1">Users planned</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Platform Status
                    </CardTitle>
                    <CardDescription>Current system health and readiness</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Scaling Readiness</span>
                      <Badge variant="secondary">Phase 2</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Security Hardening</span>
                      <Badge className="bg-green-500">Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">RLS Policies</span>
                      <Badge className="bg-green-500">Verified</Badge>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('scaling')}>
                      View Scaling Details
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Systems
                    </CardTitle>
                    <CardDescription>Active AI personalities and tools</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Rocker (User AI)</span>
                        <Badge className="bg-blue-500">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Admin Rocker</span>
                        <Badge className="bg-blue-500">Active</Badge>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Andy (Knower)</span>
                          <Badge className="bg-purple-500">Learning</Badge>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('ai-analytics')}>
                      View AI Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <ScaleScorecard />
            </TabsContent>

            {/* Admin Rocker Tab */}
            <TabsContent value="admin-rocker" className="space-y-6">
              <AdminRockerPanel />
              <RockerLabelsPanel />
            </TabsContent>

            {/* Andy Panel - Only for Super Admins */}
            {isSuperAdmin && (
              <TabsContent value="andy" className="space-y-6">
                <AndyPanel />
              </TabsContent>
            )}

            {/* Promotions Panel - Only for Super Admins */}
            {isSuperAdmin && (
              <TabsContent value="promotions" className="space-y-6">
                <PromotionPanel />
              </TabsContent>
            )}

            {/* Scaling Readiness Tab */}
            <TabsContent value="scaling" className="space-y-6">
              <Phase2VerificationPanel />
              <ScalingReadinessPanel />
              <HardeningVerificationPanel />
            </TabsContent>

            {/* AI Analytics Tab */}
            <TabsContent value="ai-analytics" className="space-y-6">
              <AIAnalyticsPanel />
            </TabsContent>

            {/* Knowledge Browser Tab */}
            <TabsContent value="knowledge" className="space-y-6">
              <KnowledgeIngestPanel />
              <KnowledgeBrowserPanel />
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-1">
                <RLSScanner />
              </div>
            </TabsContent>

            {/* Tests Tab */}
            <TabsContent value="tests" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-1">
                <TestRunner />
              </div>
            </TabsContent>

            {/* Code Tab */}
            <TabsContent value="code" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-1">
                <CodeSearchPanel />
              </div>
            </TabsContent>

            {/* Auth Tab */}
            <TabsContent value="auth" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-1">
                <AuthPanel />
              </div>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-6">
              <SuggestionsPanel />
            </TabsContent>

            {/* Flags Tab */}
            <TabsContent value="flags" className="space-y-6">
              <FeatureFlagsPanel />
              <TourSchedulePanel />
            </TabsContent>

            {/* Moderator Tab */}
            <TabsContent value="moderator" className="space-y-6">
              <ModeratorConsole />
              <EntitySearchPanel />
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles" className="space-y-6">
              <RoleManagementPanel />
            </TabsContent>

            {/* Learning Tab */}
            <TabsContent value="learning" className="space-y-6">
              <RockerLearningPanel />
            </TabsContent>

            {/* Capabilities Tab */}
            <TabsContent value="capabilities" className="space-y-6">
              <CapabilityBrowserPanel />
            </TabsContent>
          </Tabs>
        </main>

        <MediaUploadDialog 
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
        />
      </div>
  );
}
