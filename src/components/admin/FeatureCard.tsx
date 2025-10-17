/**
 * Feature Card Component
 * Expandable card showing feature details and subfeatures
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Star, AlertCircle, CheckCircle2, XCircle, Code, FileText, TestTube, Flag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Feature } from '@/lib/feature-kernel';

interface FeatureCardProps {
  feature: Feature;
  isGoldPath?: boolean;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
  onAddSubFeature: (parentId: string) => void;
}

const STATUS_COLORS = {
  shell: 'bg-gray-500',
  'full-ui': 'bg-blue-500',
  wired: 'bg-green-500',
};

export function FeatureCard({ 
  feature, 
  isGoldPath = false,
  onEdit,
  onDelete,
  onAddSubFeature 
}: FeatureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasSubFeatures = feature.subFeatures && feature.subFeatures.length > 0;

  const completionCriteria = [
    { label: 'Routes', met: feature.routes.length > 0, icon: Code },
    { label: 'Components', met: feature.components.length > 0, icon: FileText },
    { label: 'Tests', met: (feature.tests?.e2e?.length || 0) + (feature.tests?.unit?.length || 0) > 0, icon: TestTube },
    { label: 'Docs', met: !!feature.docs, icon: FileText },
    { label: 'Owner', met: !!feature.owner, icon: Star },
  ];

  const completionPct = (completionCriteria.filter(c => c.met).length / completionCriteria.length) * 100;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Left side - Feature info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {hasSubFeatures && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1 hover:bg-muted rounded"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              
              {isGoldPath && (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{feature.title}</h3>
                  {feature.status === 'shell' && feature.routes.length > 0 && (
                    <span title="Shell exposed in routes">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-muted-foreground">{feature.id}</code>
                  <Badge variant="outline" className="text-xs">{feature.area}</Badge>
                </div>
              </div>
            </div>

            {/* Metrics row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
              <span>{feature.routes.length} routes</span>
              <span>{feature.components.length} components</span>
              <span>{(feature.rpc || []).length} rpc</span>
              <span>{(feature.flags || []).length} flags</span>
            </div>

            {/* Completion indicators */}
            <div className="flex items-center gap-2 mt-3">
              {completionCriteria.map((criterion, i) => {
                const Icon = criterion.icon;
                return (
              <span>
                {criterion.met ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-300" />
                )}
              </span>
                );
              })}
              <span className="text-xs text-muted-foreground ml-2">
                {completionPct.toFixed(0)}% complete
              </span>
            </div>
          </div>

          {/* Right side - Status and actions */}
          <div className="flex flex-col items-end gap-2">
            <Badge className={STATUS_COLORS[feature.status]}>
              {feature.status}
            </Badge>
            
            {feature.severity && (
              <Badge variant={feature.severity === 'p0' ? 'destructive' : 'outline'}>
                {feature.severity.toUpperCase()}
              </Badge>
            )}

            <div className="flex gap-1 mt-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => onEdit(feature)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              {hasSubFeatures && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onAddSubFeature(feature.id)}
                  title="Add sub-feature"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => onDelete(feature.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {feature.notes && (
          <div className="mt-3 p-2 rounded bg-muted text-xs">
            {feature.notes}
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Routes */}
            {feature.routes.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1">Routes ({feature.routes.length})</div>
                <div className="flex flex-wrap gap-1">
                  {feature.routes.map((route, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-mono">
                      {route}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Components */}
            {feature.components.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1">Components ({feature.components.length})</div>
                <div className="space-y-1">
                  {feature.components.slice(0, 5).map((comp, i) => (
                    <div key={i} className="text-xs text-muted-foreground font-mono truncate">
                      {comp}
                    </div>
                  ))}
                  {feature.components.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      +{feature.components.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SubFeatures */}
            {hasSubFeatures && (
              <div>
                <div className="text-xs font-medium mb-2">Sub-Features ({feature.subFeatures!.length})</div>
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  {feature.subFeatures!.map((subId, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <code className="text-xs">{subId}</code>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flags */}
            {feature.flags && feature.flags.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1 flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  Feature Flags ({feature.flags.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {feature.flags.map((flag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Owner */}
            {feature.owner && (
              <div className="text-xs">
                <span className="text-muted-foreground">Owner: </span>
                <span className="font-medium">{feature.owner}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
