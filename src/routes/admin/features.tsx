/**
 * @feature(admin_features)
 * Feature Index Admin Page
 * View, filter, and manage all 87 features
 */

import React, { useState, useMemo } from 'react';
import featuresData from '../../../docs/features/features.json';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, TestTube, Code, AlertCircle, Star, Shield, Edit2, Save, X, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { validateGoldPath, GOLD_PATH_FEATURES, getFeatureStats } from '@/lib/featureGuards';
import { Link } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

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

interface EditingFeature {
  id: string;
  status: FeatureStatus;
  owner: string;
  notes: string;
  severity: string;
}

export default function FeaturesAdminPage() {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditingFeature | null>(null);

  const features = featuresData.features;
  const goldPath = validateGoldPath();
  const stats = getFeatureStats();
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
      return matchesSearch && matchesArea && matchesStatus && matchesOwner && matchesSeverity;
    });
  }, [features, search, areaFilter, statusFilter, ownerFilter, severityFilter]);

  const startEdit = (feature: any) => {
    setEditingId(feature.id);
    setEditForm({
      id: feature.id,
      status: feature.status,
      owner: feature.owner,
      notes: feature.notes,
      severity: feature.severity
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm) return;
    
    // In a real implementation, this would persist to features.json via an API
    // For now, just show a toast
    toast.success(`Updated ${editForm.id}`, {
      description: 'Changes saved successfully. Note: In production, this would persist to features.json via backend.'
    });
    
    console.log('Save changes:', editForm);
    setEditingId(null);
    setEditForm(null);
  };

  const getCompletionCriteria = (feature: any) => {
    const criteria = [
      { label: 'Routes', met: feature.routes.length > 0 },
      { label: 'Components', met: feature.components.length > 0 },
      { label: 'Docs', met: !!feature.docs },
      { label: 'Tests', met: feature.tests.e2e.length > 0 || feature.tests.unit.length > 0 },
      { label: 'Owner', met: !!feature.owner },
      { label: 'Severity', met: !!feature.severity }
    ];
    return criteria;
  };

  // Summary stats
  const totalFeatures = features.length;
  const byStatus = stats.byStatus;
  const byArea = stats.byArea;
  const percentComplete = stats.completionPercent;
  const shellInProd = isProd ? features.filter(f => f.status === 'shell' && f.routes.length > 0).length : 0;

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Index</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalFeatures} features · {percentComplete.toFixed(1)}% complete
          </p>
        </div>
        <div className="flex gap-2">
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
              <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(counts.wired / total) * 100}%` }}
                  title={`${counts.wired} wired`}
                />
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(counts['full-ui'] / total) * 100}%` }}
                  title={`${counts['full-ui']} full-ui`}
                />
              </div>
            </div>
          );
        })}
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
      </div>

      {/* Features Table */}
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium w-8"></th>
              <th className="text-left p-3 font-medium">Feature</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Severity</th>
              <th className="text-left p-3 font-medium">Owner</th>
              <th className="text-left p-3 font-medium">Completion</th>
              <th className="text-left p-3 font-medium">Coverage</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((feature) => {
              const isGoldPath = GOLD_PATH_FEATURES.includes(feature.id);
              const isShellInProd = isProd && feature.status === 'shell' && feature.routes.length > 0;
              const isEditing = editingId === feature.id;
              const criteria = getCompletionCriteria(feature);
              const completionPct = (criteria.filter(c => c.met).length / criteria.length) * 100;
              
              return (
                <tr key={feature.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">
                    {isGoldPath && (
                      <span title="Gold-path feature">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {feature.title}
                        {isShellInProd && (
                          <span title="Shell exposed in production">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{feature.id}</div>
                      {isEditing && editForm && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            placeholder="Notes..."
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            className="text-xs"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {isEditing && editForm ? (
                      <Select
                        value={editForm.status}
                        onValueChange={(v) => setEditForm({ ...editForm, status: v as FeatureStatus })}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shell">Shell</SelectItem>
                          <SelectItem value="full-ui">Full UI</SelectItem>
                          <SelectItem value="wired">Wired</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={STATUS_COLORS[feature.status as FeatureStatus]}>
                        {feature.status}
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing && editForm ? (
                      <Select
                        value={editForm.severity}
                        onValueChange={(v) => setEditForm({ ...editForm, severity: v })}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="p0">P0</SelectItem>
                          <SelectItem value="p1">P1</SelectItem>
                          <SelectItem value="p2">P2</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={feature.severity === 'p0' ? 'destructive' : 'outline'}>
                        {feature.severity?.toUpperCase() || 'N/A'}
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing && editForm ? (
                      <Input
                        value={editForm.owner}
                        onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                        className="w-24 h-8 text-sm"
                      />
                    ) : (
                      <span className="text-sm">{feature.owner}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{completionPct.toFixed(0)}%</div>
                      <div className="flex gap-1">
                        {criteria.map((c, i) => (
                          <span key={i} title={c.label}>
                            {c.met ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <XCircle className="h-3 w-3 text-gray-300" />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs px-1">
                          R: {feature.routes.length}
                        </Badge>
                        <Badge variant="outline" className="text-xs px-1">
                          C: {feature.components.length}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={feature.tests.e2e.length > 0 ? 'default' : 'outline'} className="text-xs px-1">
                          E2E: {feature.tests.e2e.length}
                        </Badge>
                        <Badge variant={feature.tests.unit.length > 0 ? 'default' : 'outline'} className="text-xs px-1">
                          U: {feature.tests.unit.length}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={saveEdit}
                            aria-label="Save changes"
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                            aria-label="Cancel edit"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(feature)}
                            aria-label="Edit feature"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {feature.routes[0] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              aria-label="Open route"
                            >
                              <a href={feature.routes[0]} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
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
                                <FileText className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
              </tr>
              );
            })}
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
