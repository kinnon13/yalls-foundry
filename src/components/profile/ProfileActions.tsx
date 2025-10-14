/**
 * Profile Actions Component
 * 
 * Action buttons for editing/deleting profiles based on permissions.
 */

import { Button } from '@/components/ui/button';
import { Can } from '@/lib/auth/guards';
import { Edit, Trash } from 'lucide-react';

interface ProfileActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProfileActions({ onEdit, onDelete }: ProfileActionsProps) {
  return (
    <div className="flex gap-2">
      <Can action="update" subject="profile">
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </Can>
      
      <Can action="delete" subject="profile">
        <Button onClick={onDelete} variant="destructive" size="sm">
          <Trash className="h-4 w-4" />
          Delete
        </Button>
      </Can>
    </div>
  );
}
