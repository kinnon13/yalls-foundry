import { useProfilePins } from '@/hooks/useProfilePins';
import { PinCard } from './PinCard';
import { AddPinModal } from './AddPinModal';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical } from 'lucide-react';
import { useState } from 'react';

interface PinBoardProps {
  userId: string;
  isOwner?: boolean;
}

export function PinBoard({ userId, isOwner = false }: PinBoardProps) {
  const { data: pins = [], isLoading, remove, reorder } = useProfilePins(userId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="status" aria-label="Loading pins">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (pins.length === 0 && isOwner) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg" role="region" aria-label="Pin board">
        <p className="text-muted-foreground mb-4">No pins yet. Showcase your best content!</p>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Pin
        </Button>
        <AddPinModal open={showAddModal} onOpenChange={setShowAddModal} userId={userId} />
      </div>
    );
  }

  if (pins.length === 0) {
    return null;
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIdx = pins.findIndex(p => p.id === draggedId);
    const targetIdx = pins.findIndex(p => p.id === targetId);
    
    const newOrder = [...pins];
    const [removed] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, removed);
    
    reorder.mutate(newOrder.map(p => p.id));
    setDraggedId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pinned</h3>
        {isOwner && pins.length < 8 && (
          <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Pin
          </Button>
        )}
      </div>
      
      <div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4" 
        role="list" 
        aria-label="Pinned items"
      >
        {pins.map((pin) => (
          <div
            key={pin.id}
            draggable={isOwner}
            onDragStart={(e) => handleDragStart(e, pin.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, pin.id)}
            className={`relative ${isOwner ? 'cursor-move' : ''}`}
          >
            {isOwner && (
              <div className="absolute top-2 left-2 z-10">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <PinCard
              pin={pin}
              onRemove={isOwner ? () => remove.mutate(pin.id) : undefined}
            />
          </div>
        ))}
      </div>

      {isOwner && <AddPinModal open={showAddModal} onOpenChange={setShowAddModal} userId={userId} />}
    </div>
  );
}
