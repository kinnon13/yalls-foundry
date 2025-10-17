/**
 * @feature(admin_a11y)
 * A11y Dashboard Admin Page
 * View axe accessibility scan results
 */

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function A11yAdminPage() {
  // Placeholder - in production, load from generated/a11y-report.json
  const routes = [
    { path: '/', violations: 0 },
    { path: '/profile/:id', violations: 2 },
    { path: '/notifications', violations: 0 },
    { path: '/settings/notifications', violations: 0 },
  ];

  const totalViolations = routes.reduce((sum, r) => sum + r.violations, 0);

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accessibility Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {routes.length} routes scanned · {totalViolations} total violations
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">
            {routes.filter(r => r.violations === 0).length}
          </div>
          <div className="text-sm text-muted-foreground">Routes with 0 violations</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-red-600">{totalViolations}</div>
          <div className="text-sm text-muted-foreground">Total violations</div>
        </div>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Route</th>
              <th className="text-left p-3 font-medium">Violations</th>
              <th className="text-left p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.path} className="border-b hover:bg-muted/30">
                <td className="p-3 font-mono text-sm">{route.path}</td>
                <td className="p-3 text-sm">{route.violations}</td>
                <td className="p-3">
                  {route.violations === 0 ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Pass
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {route.violations} issues
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
