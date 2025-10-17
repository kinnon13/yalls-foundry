/**
 * FacetBar - Filters sidebar for browse/search pages
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FacetGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'range' | 'radio';
  options?: { value: string; label: string; count?: number }[];
  range?: { min: number; max: number; step?: number };
}

interface FacetBarProps {
  groups: FacetGroup[];
  values: Record<string, any>;
  onChange: (facetId: string, value: any) => void;
  onReset?: () => void;
  className?: string;
}

export function FacetBar({ 
  groups, 
  values, 
  onChange, 
  onReset,
  className 
}: FacetBarProps) {
  const hasActiveFilters = Object.keys(values).length > 0;

  return (
    <Card className={cn('sticky top-4', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filters</CardTitle>
          {hasActiveFilters && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 gap-1 text-xs"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {groups.map((group) => (
          <div key={group.id} className="space-y-3">
            <Label className="text-sm font-medium">{group.label}</Label>
            
            {group.type === 'checkbox' && group.options && (
              <div className="space-y-2">
                {group.options.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`${group.id}-${opt.value}`}
                      checked={values[group.id]?.includes(opt.value)}
                      onCheckedChange={(checked) => {
                        const current = values[group.id] || [];
                        const updated = checked
                          ? [...current, opt.value]
                          : current.filter((v: string) => v !== opt.value);
                        onChange(group.id, updated.length > 0 ? updated : undefined);
                      }}
                    />
                    <Label
                      htmlFor={`${group.id}-${opt.value}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {opt.label}
                      {opt.count !== undefined && (
                        <span className="text-muted-foreground ml-1">
                          ({opt.count})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            
            {group.type === 'range' && group.range && (
              <div className="space-y-2">
                <Slider
                  min={group.range.min}
                  max={group.range.max}
                  step={group.range.step || 1}
                  value={values[group.id] || [group.range.min, group.range.max]}
                  onValueChange={(val) => onChange(group.id, val)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${values[group.id]?.[0] || group.range.min}</span>
                  <span>${values[group.id]?.[1] || group.range.max}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
