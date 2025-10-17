/**
 * @feature(admin_features)
 * Feature Index Admin Page
 * Complete feature management with sub-features
 */

import React, { useState, useMemo } from 'react';
import { kernel, GOLD_PATH_FEATURES, Feature } from '@/lib/feature-kernel';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Shield, AlertCircle, Download, FileJson } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FeatureCard } from '@/components/admin/FeatureCard';
import { FeatureEditorDialog } from '@/components/admin/FeatureEditorDialog';

type FeatureStatus = 'shell' | 'full-ui' | 'wired';

export default function FeaturesAdminPage() {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [addingSubFeatureTo, setAddingSubFeatureTo] = useState<string | null>(null);

  const features = kernel.features;
  const goldPath = kernel.validateGoldPath();
  const stats = kernel.getStats();
  const isProd = import.meta.env.PROD;

  const filtered = useMemo(() => {
    return features.filter(f => {
      const matchesSearch =
        search === '' ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase());
      const matchesArea = areaFilter === 'all' || f.area === areaFilter;
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const matchesOwner = ownerFilter === 'all' || f.owner === ownerFilter;
      const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
      const isPlaceholder = f.notes?.includes('Auto-generated placeholder');
      const matchesPlaceholder = !showPlaceholders || isPlaceholder;
      return matchesSearch && matchesArea && matchesStatus && matchesOwner && matchesSeverity && matchesPlaceholder;
    });
  }, [features, search, areaFilter, statusFilter, ownerFilter, severityFilter, showPlaceholders]);

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature);
    setAddingSubFeatureTo(null);
    setEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingFeature(null);
    setAddingSubFeatureTo(null);
    setEditorOpen(true);
  };

  const handleAddSubFeature = (parentId: string) => {
    setEditingFeature(null);
    setAddingSubFeatureTo(parentId);
    setEditorOpen(true);
  };

  const handleDelete = (featureId: string) => {
    if (confirm(`Are you sure you want to delete feature "${featureId}"?`)) {
      toast.success(`Deleted ${featureId}`, {
        description: 'In production, this would remove the feature from features.json'
      });
    }
  };

  const handleSaveFeature = (featureData: Partial<Feature>) => {
    if (editingFeature) {
      toast.success(`Updated ${featureData.id}`, {
        description: 'Changes saved. In production, this would update features.json'
      });
    } else {
      toast.success(`Created ${featureData.id}`, {
        description: 'Feature created. In production, this would add to features.json'
      });
    }
    setEditorOpen(false);
    setEditingFeature(null);
    setAddingSubFeatureTo(null);
  };

  const handleExportJSON = () => {
    const data = JSON.stringify({ features: filtered }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `features-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported features to JSON');
  };

  // Summary stats
  const totalFeatures = features.length;
  const byStatus = stats.byStatus;
  const byArea = stats.byArea as Record<string, { shell: number; 'full-ui': number; wired: number }>;
  const percentComplete = stats.completionPercent;
  const shellInProd = isProd ? features.filter(f => f.status === 'shell' && f.routes.length > 0).length : 0;

  // Get all unique areas for filter
  const allAreas = Array.from(new Set(features.map(f => f.area))).sort();

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Index</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalFeatures} features · {percentComplete.toFixed(1)}% complete
          </p>
          <p className="text-xs text-muted-foreground">
            Sources: {stats.sources.base} base · {stats.sources.overlays} overlay · {stats.sources.generated} generated
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportJSON} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/audit">
              <Shield className="h-4 w-4 mr-2" />
              Run Audit
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {!goldPath.ready && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <div className="font-medium text-red-900">Gold-Path Not Ready</div>
              <div className="text-sm text-red-700 mt-1">
                {goldPath.blocking.length} critical features are still in shell status:
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {goldPath.blocking.map(id => (
                  <Badge key={id} variant="destructive" className="text-xs">
                    {id}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {shellInProd > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-900">Production Warning</div>
              <div className="text-sm text-yellow-700 mt-1">
                {shellInProd} shell features have routes exposed in production and should be protected
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-600">{byStatus.shell || 0}</div>
          <div className="text-sm text-muted-foreground">Shell</div>
          {isProd && byStatus.shell > 0 && (
            <div className="text-xs text-yellow-600 mt-1">Should be hidden in prod</div>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-blue-600">{byStatus['full-ui'] || 0}</div>
          <div className="text-sm text-muted-foreground">Full UI</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{byStatus.wired || 0}</div>
          <div className="text-sm text-muted-foreground">Wired</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-amber-600">{GOLD_PATH_FEATURES.length}</div>
          <div className="text-sm text-muted-foreground">Gold-Path</div>
          <div className={`text-xs mt-1 ${goldPath.ready ? 'text-green-600' : 'text-red-600'}`}>
            {goldPath.ready ? 'All ready' : `${goldPath.blocking.length} blocking`}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
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
            {allAreas.map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
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
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="p0">P0</SelectItem>
            <SelectItem value="p1">P1</SelectItem>
            <SelectItem value="p2">P2</SelectItem>
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
        <Button
          variant={showPlaceholders ? 'default' : 'outline'}
          onClick={() => setShowPlaceholders(!showPlaceholders)}
          size="sm"
        >
          {showPlaceholders ? 'Showing Placeholders' : 'Show Placeholders'}
        </Button>
      </div>

      {/* Features Grid */}
      <div className="space-y-3">
        {filtered.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            isGoldPath={GOLD_PATH_FEATURES.includes(feature.id)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddSubFeature={handleAddSubFeature}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No features match your filters
        </div>
      )}

      {/* Feature Editor Dialog */}
      <FeatureEditorDialog
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingFeature(null);
          setAddingSubFeatureTo(null);
        }}
        onSave={handleSaveFeature}
        feature={editingFeature}
        parentId={addingSubFeatureTo || undefined}
      />
    </div>
  );
}
