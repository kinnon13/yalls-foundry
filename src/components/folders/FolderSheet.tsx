/**
 * FolderSheet Component
 * Overlay view of folder contents
 */

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Plus } from 'lucide-react';
import type { PinFolder } from '@/hooks/usePinFolders';

interface FolderSheetProps {
  folder: PinFolder;
  open: boolean;
  onClose: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export function FolderSheet({
  folder,
  open,
  onClose,
  onRename,
  onDelete,
  children,
}: FolderSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(folder.title);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== folder.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span className="text-2xl">{folder.icon ?? '📁'}</span>
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                autoFocus
                className="flex-1"
              />
            ) : (
              <span className="flex-1">{folder.title}</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
              aria-label="Rename folder"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label="Delete folder"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </SheetTitle>
          <SheetDescription>
            Manage items in this folder
          </SheetDescription>
        </SheetHeader>

        {/* Folder contents (passed as children) */}
        <div className="mt-6 grid gap-4 grid-cols-3 sm:grid-cols-4">
          {children}
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose} className="w-full">
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
