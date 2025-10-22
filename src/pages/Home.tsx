/**
 * Home Page
 * Quick links to main workspaces
 */

import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-2">Welcome to Super Andy</h1>
      <p className="text-muted-foreground mb-8">Choose your workspace to get started.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Super Andy</h3>
          <p className="text-muted-foreground mb-4">
            AI-powered proactive assistant with chat, suggestions, and self-improvement.
          </p>
          <Button asChild>
            <Link to="/super-andy">Open Super Andy</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">User Rocker</h3>
          <p className="text-muted-foreground mb-4">
            Your personal productivity hub for goals, bookmarks, and preferences.
          </p>
          <Button asChild variant="secondary">
            <Link to="/rocker">Open User Rocker</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Admin Rocker</h3>
          <p className="text-muted-foreground mb-4">
            Admin workspace for tools, audits, moderation, and budget management.
          </p>
          <Button asChild variant="outline">
            <Link to="/admin-rocker">Open Admin Rocker</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Super Console</h3>
          <p className="text-muted-foreground mb-4">
            System overview, worker pools, flags, and incident management.
          </p>
          <Button asChild variant="outline">
            <Link to="/super">Open Console</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
