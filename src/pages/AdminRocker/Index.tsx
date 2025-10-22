/**
 * Admin Rocker Overview
 * Admin workspace hub
 */

import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminRocker() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Admin Rocker</h1>
      <p className="text-muted-foreground mb-8">
        Admin workspace for tools, audits, moderation, and budget management.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Tools Registry</h3>
          <p className="text-muted-foreground mb-4">
            View and manage role-scoped AI tools and capabilities.
          </p>
          <Button asChild variant="outline">
            <Link to="/admin-rocker/tools">View Tools</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Action Ledger & Audits</h3>
          <p className="text-muted-foreground mb-4">
            Browse action history, verify outputs, and audit trails.
          </p>
          <Button asChild variant="outline">
            <Link to="/admin-rocker/audits">View Audits</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Moderation</h3>
          <p className="text-muted-foreground mb-4">
            Handle incidents, content review, and escalations.
          </p>
          <Button asChild variant="outline">
            <Link to="/admin-rocker/moderation">View Moderation</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Model Routes & Budgets</h3>
          <p className="text-muted-foreground mb-4">
            Configure model routing and monitor budget usage.
          </p>
          <Button asChild variant="outline">
            <Link to="/admin-rocker/budgets">View Budgets</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
