/**
 * Feature Editor Dialog
 * Full-featured modal for adding/editing features
 */

import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Feature } from '@/lib/feature-kernel';

interface FeatureEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (feature: Partial<Feature>) => void;
  feature?: Feature | null;
  parentId?: string;
}

export function FeatureEditorDialog({ 
  open, 
  onClose, 
  onSave, 
  feature,
  parentId 
}: FeatureEditorDialogProps) {
  const [formData, setFormData] = useState<Partial<Feature>>({
    id: '',
    title: '',
    area: 'platform',
    status: 'shell',
    routes: [],
    components: [],
    rpc: [],
    flags: [],
    docs: '',
    tests: { unit: [], e2e: [] },
    owner: '',
    severity: 'p2',
    notes: '',
    parentFeature: parentId || '',
    subFeatures: [],
  });

  const [newRoute, setNewRoute] = useState('');
  const [newComponent, setNewComponent] = useState('');
  const [newFlag, setNewFlag] = useState('');
  const [newSubFeature, setNewSubFeature] = useState('');

  useEffect(() => {
    if (feature) {
      setFormData(feature);
    } else if (parentId) {
      setFormData(prev => ({ ...prev, parentFeature: parentId }));
    }
  }, [feature, parentId]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const addToArray = (field: keyof Feature, value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[] || []), value.trim()]
    }));
    setValue('');
  };

  const removeFromArray = (field: keyof Feature, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[] || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {feature ? 'Edit Feature' : parentId ? 'Add Sub-Feature' : 'Add New Feature'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">Feature ID *</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="e.g., profile_pins"
                disabled={!!feature}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Profile Pins"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Select value={formData.area} onValueChange={(v) => setFormData({ ...formData, area: v })}>
                <SelectTrigger id="area">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Platform</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="composer">Composer</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="producer">Producer</SelectItem>
                  <SelectItem value="earnings">Earnings</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="messaging">Messaging</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shell">Shell</SelectItem>
                  <SelectItem value="full-ui">Full UI</SelectItem>
                  <SelectItem value="wired">Wired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={formData.severity} onValueChange={(v) => setFormData({ ...formData, severity: v as any })}>
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p0">P0 - Critical</SelectItem>
                  <SelectItem value="p1">P1 - Important</SelectItem>
                  <SelectItem value="p2">P2 - Nice to have</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="e.g., web, platform"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Implementation notes, dependencies, etc."
              rows={3}
            />
          </div>

          {/* Routes */}
          <div className="space-y-2">
            <Label>Routes</Label>
            <div className="flex gap-2">
              <Input
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
                placeholder="/profile/:id"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('routes', newRoute, setNewRoute);
                  }
                }}
              />
              <Button type="button" onClick={() => addToArray('routes', newRoute, setNewRoute)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(formData.routes || []).map((route, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {route}
                  <button onClick={() => removeFromArray('routes', i)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Components */}
          <div className="space-y-2">
            <Label>Components</Label>
            <div className="flex gap-2">
              <Input
                value={newComponent}
                onChange={(e) => setNewComponent(e.target.value)}
                placeholder="src/components/..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('components', newComponent, setNewComponent);
                  }
                }}
              />
              <Button type="button" onClick={() => addToArray('components', newComponent, setNewComponent)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 mt-2 max-h-32 overflow-y-auto">
              {(formData.components || []).map((comp, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-muted text-xs">
                  <span className="truncate font-mono">{comp}</span>
                  <button onClick={() => removeFromArray('components', i)}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Flags */}
          <div className="space-y-2">
            <Label>Feature Flags</Label>
            <div className="flex gap-2">
              <Input
                value={newFlag}
                onChange={(e) => setNewFlag(e.target.value)}
                placeholder="flag_name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('flags', newFlag, setNewFlag);
                  }
                }}
              />
              <Button type="button" onClick={() => addToArray('flags', newFlag, setNewFlag)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(formData.flags || []).map((flag, i) => (
                <Badge key={i} variant="outline" className="gap-1">
                  {flag}
                  <button onClick={() => removeFromArray('flags', i)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Sub-Features */}
          <div className="space-y-2">
            <Label>Sub-Features</Label>
            <div className="flex gap-2">
              <Input
                value={newSubFeature}
                onChange={(e) => setNewSubFeature(e.target.value)}
                placeholder="sub_feature_id"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('subFeatures', newSubFeature, setNewSubFeature);
                  }
                }}
              />
              <Button type="button" onClick={() => addToArray('subFeatures', newSubFeature, setNewSubFeature)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(formData.subFeatures || []).map((sub, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {sub}
                  <button onClick={() => removeFromArray('subFeatures', i)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Documentation */}
          <div className="space-y-2">
            <Label htmlFor="docs">Documentation URL</Label>
            <Input
              id="docs"
              value={formData.docs}
              onChange={(e) => setFormData({ ...formData, docs: e.target.value })}
              placeholder="docs/features/..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            {feature ? 'Save Changes' : 'Create Feature'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
