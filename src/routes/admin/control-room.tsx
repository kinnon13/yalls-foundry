/**
 * Control Room - Admin Dashboard
 * 
 * Centralized diagnostic and testing interface with organized tabs.
 * Quick access to RLS scanning, test running, exports, and platform health.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, TestTube, Code, FileCheck, Activity, 
  MessageSquare, Settings, Home, Gauge, Search, Upload, Flag
} from 'lucide-react';

// Import panel components
import RLSScanner from '@/routes/admin/panels/RLSScanner';
import TestRunner from '@/routes/admin/panels/TestRunner';
import CodeSearchPanel from '@/routes/admin/panels/CodeSearchPanel';
import AuthPanel from '@/routes/admin/panels/AuthPanel';
import FeedbackInbox from '@/routes/admin/panels/FeedbackInbox';
import { SuggestionsPanel } from '@/routes/admin/panels/SuggestionsPanel';
import { FlagsPanel } from '@/routes/admin/panels/FlagsPanel';
import { EntitySearchPanel } from '@/routes/admin/panels/EntitySearchPanel';
import { ScaleScorecard } from '@/lib/observability/ScaleScorecard';
import { MediaUploadDialog } from '@/components/media/MediaUploadDialog';
import { ModeratorConsole } from '@/routes/admin/panels/ModeratorConsole';
import AIAnalyticsPanel from '@/routes/admin/panels/AIAnalyticsPanel';
import KnowledgeBrowserPanel from '@/routes/admin/panels/KnowledgeBrowserPanel';

export default function ControlRoom() {
  const [activeTab, setActiveTab] = useState('ai-analytics');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  return (
    <>
      <SEOHelmet 
        title="Control Room" 
        description="Admin dashboard for diagnostics, testing, and platform monitoring" 
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Control Room
              </h1>
              <p className="text-sm text-muted-foreground">
                Platform diagnostics, testing, and monitoring
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setUploadDialogOpen(true)} size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload with Rocker
              </Button>
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-12 lg:w-auto">
              <TabsTrigger value="ai-analytics" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2">
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Knowledge</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="tests" className="gap-2">
                <TestTube className="h-4 w-4" />
                <span className="hidden sm:inline">Tests</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-2">
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Code</span>
              </TabsTrigger>
              <TabsTrigger value="auth" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Auth</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Feedback</span>
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-2">
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
              <TabsTrigger value="flags" className="gap-2">
                <Flag className="h-4 w-4" />
                <span className="hidden sm:inline">Flags</span>
              </TabsTrigger>
              <TabsTrigger value="moderator" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Moderator</span>
              </TabsTrigger>
              <TabsTrigger value="scale" className="gap-2">
                <Gauge className="h-4 w-4" />
                <span className="hidden sm:inline">Scale</span>
              </TabsTrigger>
            </TabsList>

            {/* AI Analytics Tab */}
            <TabsContent value="ai-analytics" className="space-y-6">
              <AIAnalyticsPanel />
            </TabsContent>

            {/* Knowledge Browser Tab */}
            <TabsContent value="knowledge" className="space-y-6">
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

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-1">
                <EntitySearchPanel />
              </div>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-1">
                <FeedbackInbox />
              </div>
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-1">
                <SuggestionsPanel />
              </div>
            </TabsContent>

            {/* Flags Tab */}
            <TabsContent value="flags" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-1">
                <FlagsPanel />
              </div>
            </TabsContent>

            {/* Moderator Tab */}
            <TabsContent value="moderator" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-1">
                <ModeratorConsole />
              </div>
            </TabsContent>

            {/* Scale Tab */}
            <TabsContent value="scale" className="space-y-6">
              <ScaleScorecard />
            </TabsContent>
          </Tabs>

          {/* Quick Stats Footer */}
          <div className="mt-12 pt-6 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 border rounded">
                <div className="text-2xl font-bold">10</div>
                <div className="text-xs text-muted-foreground">Panels</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-2xl font-bold">✓</div>
                <div className="text-xs text-muted-foreground">Entity Search</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-2xl font-bold">✓</div>
                <div className="text-xs text-muted-foreground">AI Evolution</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-2xl font-bold">✓</div>
                <div className="text-xs text-muted-foreground">Export Ready</div>
              </div>
            </div>
          </div>
        </main>

        <MediaUploadDialog 
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
        />
      </div>
    </>
  );
}
