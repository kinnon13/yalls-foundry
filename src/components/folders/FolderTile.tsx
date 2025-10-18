/**
 * FolderTile Component
 * Rounded square folder representation
 */

import type { PinFolder } from '@/hooks/usePinFolders';

interface FolderTileProps {
  folder: PinFolder;
  onOpen: () => void;
  itemCount?: number;
}

export function FolderTile({ folder, onOpen, itemCount = 0 }: FolderTileProps) {
  return (
    <button
      onClick={onOpen}
      className="relative w-20 h-20 rounded-2xl bg-zinc-900/80 shadow hover:shadow-lg active:translate-y-[1px] transition-all"
      aria-label={`Open ${folder.title} folder`}
      style={{
        backgroundColor: folder.color ? `${folder.color}20` : undefined,
      }}
    >
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/5" />
      
      {/* Icon */}
      <div className="absolute top-2 left-2 text-xl">{folder.icon ?? '📁'}</div>

      {/* Item count badge */}
      {itemCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
          {itemCount}
        </div>
      )}

      {/* Title */}
      <div className="absolute bottom-1 w-full text-center text-[11px] truncate px-1 opacity-90">
        {folder.title}
      </div>
    </button>
  );
}
