/**
 * @feature(admin_features)
 * Feature Index Admin Page
 * View, filter, and manage all 87 features
 */

import React, { useState, useMemo } from 'react';
import featuresData from '@/../../docs/features/features.json';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, TestTube, Code } from 'lucide-react';

type FeatureStatus = 'shell' | 'full-ui' | 'wired';
type FeatureArea = 'profile' | 'notifications' | 'composer' | 'events' | 'producer' | 'earnings' | 'ai';

const STATUS_COLORS: Record<FeatureStatus, string> = {
  shell: 'bg-gray-500',
  'full-ui': 'bg-blue-500',
  wired: 'bg-green-500',
};

const AREA_LABELS: Record<FeatureArea, string> = {
  profile: 'Profile',
  notifications: 'Notifications',
  composer: 'Composer',
  events: 'Events',
  producer: 'Producer',
  earnings: 'Earnings',
  ai: 'AI',
};

export default function FeaturesAdminPage() {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  const features = featuresData.features;

  const filtered = useMemo(() => {
    return features.filter(f => {
      const matchesSearch =
        search === '' ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase());
      const matchesArea = areaFilter === 'all' || f.area === areaFilter;
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchesOwner = ownerFilter === 'all' || f.owner === ownerFilter;
      return matchesSearch && matchesArea && matchesStatus && matchesOwner;
    });
  }, [features, search, areaFilter, statusFilter, ownerFilter]);

  // Summary stats
  const totalFeatures = features.length;
  const byStatus = features.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byArea = features.reduce((acc, f) => {
    if (!acc[f.area]) acc[f.area] = { shell: 0, 'full-ui': 0, wired: 0 };
    acc[f.area][f.status as FeatureStatus] += 1;
    return acc;
  }, {} as Record<string, Record<FeatureStatus, number>>);

  const percentComplete = ((byStatus['full-ui'] || 0) + (byStatus.wired || 0)) / totalFeatures * 100;

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feature Index</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalFeatures} features · {percentComplete.toFixed(1)}% complete
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{byStatus.shell || 0}</div>
          <div className="text-sm text-muted-foreground">Shell</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{byStatus['full-ui'] || 0}</div>
          <div className="text-sm text-muted-foreground">Full UI</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{byStatus.wired || 0}</div>
          <div className="text-sm text-muted-foreground">Wired</div>
        </div>
      </div>

      {/* Progress by Area */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Progress by Area</h2>
        {Object.entries(byArea).map(([area, counts]) => {
          const total = counts.shell + counts['full-ui'] + counts.wired;
          const complete = counts['full-ui'] + counts.wired;
          const pct = (complete / total) * 100;

          return (
            <div key={area} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{AREA_LABELS[area as FeatureArea] || area}</span>
                <span className="text-muted-foreground">
                  {complete}/{total} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search features..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {Object.keys(AREA_LABELS).map(a => (
              <SelectItem key={a} value={a}>{AREA_LABELS[a as FeatureArea]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="shell">Shell</SelectItem>
            <SelectItem value="full-ui">Full UI</SelectItem>
            <SelectItem value="wired">Wired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="platform">Platform</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Features Table */}
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Feature</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Owner</th>
              <th className="text-left p-3 font-medium">Routes</th>
              <th className="text-left p-3 font-medium">Components</th>
              <th className="text-left p-3 font-medium">Tests</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((feature) => (
              <tr key={feature.id} className="border-b hover:bg-muted/30">
                <td className="p-3">
                  <div>
                    <div className="font-medium">{feature.title}</div>
                    <div className="text-xs text-muted-foreground">{feature.id}</div>
                  </div>
                </td>
                <td className="p-3">
                  <Badge className={STATUS_COLORS[feature.status as FeatureStatus]}>
                    {feature.status}
                  </Badge>
                </td>
                <td className="p-3 text-sm">{feature.owner}</td>
                <td className="p-3 text-sm">{feature.routes.length}</td>
                <td className="p-3 text-sm">{feature.components.length}</td>
                <td className="p-3 text-sm">
                  {feature.tests.e2e.length + feature.tests.unit.length}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {feature.routes[0] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        aria-label="Open route"
                      >
                        <a href={feature.routes[0]} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {feature.docs && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        aria-label="View docs"
                      >
                        <a href={`/${feature.docs}`} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {(feature.tests.e2e.length > 0 || feature.tests.unit.length > 0) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="View tests"
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>
                    )}
                    {feature.components.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="View components"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No features match your filters
        </div>
      )}
    </div>
  );
}
