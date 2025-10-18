/**
 * PinsWithFolders Component
 * Displays pinned entities organized in folders
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePinFolders, useSectionPins, type PinSection } from '@/hooks/usePinFolders';
import { FolderTile } from '@/components/folders/FolderTile';
import { FolderSheet } from '@/components/folders/FolderSheet';
import { AppBubble } from './AppBubble';
import { Building2, Plus } from 'lucide-react';
import { useRocker } from '@/lib/ai/rocker';
import { Button } from '@/components/ui/button';

interface PinsWithFoldersProps {
  section: PinSection;
  entityId?: string;
}

export function PinsWithFolders({ section, entityId }: PinsWithFoldersProps) {
  const { log } = useRocker();
  const [userId, setUserId] = useState<string | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const folders = usePinFolders(userId, section);
  const rootPins = useSectionPins(userId, section, null);

  // Get folder contents count
  const folderCounts = useQuery({
    queryKey: ['folder-counts', userId, section, folders.data],
    queryFn: async () => {
      if (!userId || !folders.data) return {};
      
      const counts: Record<string, number> = {};
      for (const folder of folders.data) {
        const { count } = await supabase
          .from('user_pins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('section', section)
          .eq('folder_id', folder.id);
        counts[folder.id] = count || 0;
      }
      return counts;
    },
    enabled: !!userId && !!folders.data
  });

  // Resolve pinned entities
  const { data: resolvedPins } = useQuery({
    queryKey: ['resolved-pins', userId, section, rootPins.data],
    queryFn: async () => {
      if (!rootPins.data) return [];
      const entityPins = rootPins.data.filter(p => p.pin_type === 'entity');
      if (entityPins.length === 0) return [];

      const entityIds = entityPins.map(p => p.ref_id);
      const { data } = await supabase
        .from('entities')
        .select('id, display_name, kind, status, handle, owner_user_id')
        .in('id', entityIds);

      return (data || []).map(e => ({
        ...e,
        pin: entityPins.find(p => p.ref_id === e.id)
      }));
    },
    enabled: !!rootPins.data
  });

  const openFolder = folders.data?.find(f => f.id === openFolderId);

  const handleCreateFolder = async () => {
    if (!userId) return;
    const title = prompt('Folder name:');
    if (!title) return;
    
    await folders.create.mutateAsync({ title, icon: '📁' });
    log('folder_create', { section, title });
  };

  const handleRenameFolder = async (folderId: string, newTitle: string) => {
    await folders.rename.mutateAsync({ id: folderId, title: newTitle });
    log('folder_rename', { section, folder_id: folderId, title: newTitle });
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Pins inside will be moved to the root.')) return;
    await folders.remove.mutateAsync(folderId);
    setOpenFolderId(null);
    log('folder_delete', { section, folder_id: folderId });
  };

  const getEntityRoute = (entity: { id: string; owner_user_id?: string | null }) => {
    return entity.owner_user_id === userId 
      ? `/workspace/${entity.id}/dashboard` 
      : `/entities/${entity.id}`;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold">
            {section === 'home' ? 'My Apps' : `${section.charAt(0).toUpperCase()}${section.slice(1)}`}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateFolder}
            disabled={folders.create.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {/* Folders */}
          {folders.data?.map(folder => (
            <FolderTile
              key={folder.id}
              folder={folder}
              onOpen={() => {
                setOpenFolderId(folder.id);
                log('folder_open', { section, folder_id: folder.id });
              }}
              itemCount={folderCounts.data?.[folder.id] || 0}
            />
          ))}

          {/* Root pins */}
          {resolvedPins?.map(entity => (
            <AppBubble
              key={entity.id}
              to={getEntityRoute(entity)}
              icon={<Building2 className="h-6 w-6" />}
              title={entity.display_name}
              meta={entity.status === 'unclaimed' ? 'Unclaimed' : entity.kind}
              accent={entity.status === 'unclaimed' ? 'hsl(45 85% 60%)' : 'hsl(200 90% 55%)'}
              onClick={() => log('tile_open', { section, entity_id: entity.id })}
            />
          ))}
        </div>
      </div>

      {/* Folder Sheet */}
      {openFolder && (
        <FolderSheet
          folder={openFolder}
          open={!!openFolderId}
          onClose={() => setOpenFolderId(null)}
          onRename={(newTitle) => handleRenameFolder(openFolder.id, newTitle)}
          onDelete={() => handleDeleteFolder(openFolder.id)}
        >
          {/* Folder contents */}
          <div className="grid gap-3 grid-cols-3">
            {/* TODO: Load and display folder contents */}
            <p className="text-sm text-muted-foreground col-span-3">
              Folder contents coming soon...
            </p>
          </div>
        </FolderSheet>
      )}
    </>
  );
}
