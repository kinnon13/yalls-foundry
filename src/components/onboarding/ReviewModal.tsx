/**
 * Review Modal
 * Shows collected business data for confirmation before save
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';
import { Building2, Globe, Phone, FileText } from 'lucide-react';

interface ReviewModalProps {
  open: boolean;
  data: {
    name?: string;
    categories?: Array<{ label: string; status: 'active' | 'pending' }>;
    website?: string;
    phone?: string;
    bio?: string;
    claimEntityId?: string;
  };
  onEdit: (field: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function ReviewModal({ open, data, onEdit, onConfirm, onClose }: ReviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Your Business Details</DialogTitle>
          <DialogDescription>
            Make sure everything looks good before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Business Name</p>
                <p className="text-base">{data.name || 'Not provided'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit('name')}
            >
              Edit
            </Button>
          </div>

          {/* Claiming notice */}
          {data.claimEntityId && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                📍 You're claiming an existing business listing
              </p>
            </div>
          )}

          {/* Categories */}
          {data.categories && data.categories.length > 0 && (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {data.categories.map((cat, idx) => (
                    <Badge
                      key={idx}
                      variant={cat.status === 'active' ? 'default' : 'secondary'}
                    >
                      {cat.label}
                      {cat.status === 'pending' && ' (pending)'}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit('categories')}
              >
                Edit
              </Button>
            </div>
          )}

          {/* Website */}
          {data.website && (
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <p className="text-base">{data.website}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit('contact')}
              >
                Edit
              </Button>
            </div>
          )}

          {/* Phone */}
          {data.phone && (
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-base">{data.phone}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit('contact')}
              >
                Edit
              </Button>
            </div>
          )}

          {/* Bio */}
          {data.bio && (
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Bio</p>
                  <p className="text-sm text-muted-foreground">{data.bio}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit('bio')}
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
