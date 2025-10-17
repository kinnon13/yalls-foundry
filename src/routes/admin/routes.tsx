/**
 * @feature(admin_routes)
 * Route Manifest Admin Page
 * View all routes with features and flags
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RouteEntry {
  path: string;
  file: string;
  components: string[];
  flags: string[];
  features: string[];
}

export default function RoutesAdminPage() {
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/generated/route-manifest.json')
      .then(res => res.json())
      .then(data => {
        setRoutes(data.routes || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load route manifest:', err);
        setLoading(false);
      });
  }, []);

  const filtered = routes.filter(r =>
    search === '' ||
    r.path.toLowerCase().includes(search.toLowerCase()) ||
    r.file.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Route Manifest</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {routes.length} routes registered
        </p>
      </div>

      <Input
        placeholder="Search routes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading routes...</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Path</th>
                <th className="text-left p-3 font-medium">File</th>
                <th className="text-left p-3 font-medium">Features</th>
                <th className="text-left p-3 font-medium">Flags</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((route) => (
                <tr key={route.path} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-sm">{route.path}</td>
                  <td className="p-3 text-sm text-muted-foreground">{route.file}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {route.features.map(f => (
                        <Badge key={f} variant="outline">{f}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {route.flags.map(f => (
                        <Badge key={f} variant="secondary">{f}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      aria-label="Open route"
                    >
                      <a href={route.path} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No routes match your search
        </div>
      )}
    </div>
  );
}
