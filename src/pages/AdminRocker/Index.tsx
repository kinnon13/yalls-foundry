/**
 * Admin Rocker Console - Main dashboard for AI administration
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Activity, DollarSign, Wrench } from 'lucide-react';

export default function AdminRockerIndex() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Rocker Console</h1>
        <p className="text-muted-foreground">
          AI administration, monitoring, and control center
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Audits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Action Audits
            </CardTitle>
            <CardDescription>
              View action history and audit trails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin-rocker/audits">View Audit Logs</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Budgets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Model Budgets
            </CardTitle>
            <CardDescription>
              Configure model routing and monitor usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin-rocker/budgets">Manage Budgets</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Admin Tools
            </CardTitle>
            <CardDescription>
              Manual controls and testing utilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin-rocker/tools">Open Tools</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Moderation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Content Moderation
            </CardTitle>
            <CardDescription>
              Review flagged content and moderate AI outputs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin-rocker/moderation">View Queue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">—</div>
              <div className="text-sm text-muted-foreground">Active Workers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">—</div>
              <div className="text-sm text-muted-foreground">Pending Actions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">—</div>
              <div className="text-sm text-muted-foreground">Budget Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
