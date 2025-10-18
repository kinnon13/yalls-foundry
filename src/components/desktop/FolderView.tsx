/**
 * Folder View - Opens to show apps inside
 */

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppFolder } from '@/hooks/useAppPins';

interface FolderViewProps {
  folder: AppFolder;
  onClose: () => void;
  onAppClick: (appId: string) => void;
}

export function FolderView({ folder, onClose, onAppClick }: FolderViewProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-background/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-6 w-[90vw] max-w-2xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{folder.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            aria-label="Close folder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-4 gap-6">
          {folder.apps?.map((app) => (
            <button
              key={app.id}
              onClick={() => {
                onAppClick(app.app_id);
                onClose();
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl",
                "hover:bg-muted/50 transition-colors"
              )}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {/* App icon would go here */}
                <span className="text-2xl">📱</span>
              </div>
              <span className="text-xs text-center">{app.app_id}</span>
            </button>
          ))}
        </div>

        {folder.apps?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Folder is empty</p>
            <p className="text-sm mt-2">Drag apps here to add them</p>
          </div>
        )}
      </div>
    </div>
  );
}
