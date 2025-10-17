/**
 * @feature(admin_components)
 * Component Registry Admin Page
 * View all components with feature tags
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ComponentEntry {
  path: string;
  exports: string[];
  features: string[];
}

export default function ComponentsAdminPage() {
  const [components, setComponents] = useState<ComponentEntry[]>([]);
  const [search, setSearch] = useState('');
  const [featureFilter, setFeatureFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/generated/component-registry.json')
      .then(res => res.json())
      .then(data => {
        setComponents(data.components || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load component registry:', err);
        setLoading(false);
      });
  }, []);

  const allFeatures = [...new Set(components.flatMap(c => c.features))].sort();

  const filtered = components.filter(c =>
    (search === '' ||
      c.path.toLowerCase().includes(search.toLowerCase()) ||
      c.exports.some(e => e.toLowerCase().includes(search.toLowerCase()))) &&
    (featureFilter === 'all' || c.features.includes(featureFilter))
  );

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Component Registry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {components.length} components registered
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={featureFilter} onValueChange={setFeatureFilter}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Filter by feature" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Features</SelectItem>
            {allFeatures.map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading components...</div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Component</th>
                <th className="text-left p-3 font-medium">Exports</th>
                <th className="text-left p-3 font-medium">Features</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((comp) => (
                <tr key={comp.path} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-sm">{comp.path}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {comp.exports.map(e => (
                        <Badge key={e} variant="outline">{e}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {comp.features.map(f => (
                        <Badge key={f} variant="secondary">{f}</Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No components match your filters
        </div>
      )}
    </div>
  );
}
