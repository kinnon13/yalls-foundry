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
  MessageSquare, Settings, Home 
} from 'lucide-react';

// Import panel components
import RLSScanner from '@/routes/admin/panels/RLSScanner';
import TestRunner from '@/routes/admin/panels/TestRunner';
import CodeSearchPanel from '@/routes/admin/panels/CodeSearchPanel';
import AuthPanel from '@/routes/admin/panels/AuthPanel';
import FeedbackInbox from '@/routes/admin/panels/FeedbackInbox';
import { SuggestionsPanel } from '@/routes/admin/panels/SuggestionsPanel';

export default function ControlRoom() {
  const [activeTab, setActiveTab] = useState('security');

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
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <TabsList className="grid w-full grid-cols-6 lg:w-auto">
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
              <TabsTrigger value="feedback" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Feedback</span>
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-2">
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">AI Suggestions</span>
              </TabsTrigger>
            </TabsList>

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
          </Tabs>

          {/* Quick Stats Footer */}
          <div className="mt-12 pt-6 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 border rounded">
                <div className="text-2xl font-bold">6</div>
                <div className="text-xs text-muted-foreground">Panels</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-2xl font-bold">✓</div>
                <div className="text-xs text-muted-foreground">RLS Scanning</div>
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
      </div>
    </>
  );
}
