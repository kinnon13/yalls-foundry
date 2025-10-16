/**
 * Create Modal Router
 * 
 * Query-string controlled modal system for creating posts/listings/events anywhere.
 * Contract: ?modal=create_post|create_listing|create_event&context=source:{feed|profile:<id>}
 */

import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

const ComposerModal = lazy(() => import('./ComposerModal'));
const CreateListingModal = lazy(() => import('./CreateListingModal'));
const CreateEventModal = lazy(() => import('./CreateEventModal'));

export type CreateContext = { source: 'feed' | `profile:${string}` };

export function CreateModalRouter() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const modal = searchParams.get('modal');
  const contextStr = searchParams.get('context') || 'source:feed';
  
  // Parse context
  const context: CreateContext = {
    source: contextStr.startsWith('source:profile:') 
      ? contextStr.replace('source:', '') as `profile:${string}`
      : 'feed'
  };

  const handleClose = () => {
    searchParams.delete('modal');
    searchParams.delete('context');
    searchParams.delete('draftId');
    setSearchParams(searchParams, { replace: true });
  };

  const handleSaved = (draftId: string) => {
    console.log('Draft saved:', draftId);
  };

  const handlePublished = (entityId: string) => {
    console.log('Published:', entityId);
    handleClose();
    // Refresh will be handled by parent components via React Query
  };

  const isOpen = modal?.startsWith('create_');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={handleClose}
      >
        <Suspense fallback={<LoadingSkeleton />}>
          {modal === 'create_post' && (
            <ComposerModal
              context={context}
              onSaved={handleSaved}
              onPublished={handlePublished}
              onClose={handleClose}
            />
          )}
          {modal === 'create_listing' && (
            <CreateListingModal
              context={context}
              onSaved={handleSaved}
              onPublished={handlePublished}
              onClose={handleClose}
            />
          )}
          {modal === 'create_event' && (
            <CreateEventModal
              context={context}
              onSaved={handleSaved}
              onPublished={handlePublished}
              onClose={handleClose}
            />
          )}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
