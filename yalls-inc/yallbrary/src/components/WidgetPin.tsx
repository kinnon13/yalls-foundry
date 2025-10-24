/**
 * Role: Drag-drop widget pinning component with responsive touch support
 * Path: yalls-inc/yallbrary/src/components/WidgetPin.tsx
 * Responsive: grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
 * Imports: @dnd-kit/core, @/lib/auth/context
 */

import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical } from 'lucide-react';

interface Widget {
  id: string;
  title: string;
  description: string;
  isPinned: boolean;
}

interface WidgetPinProps {
  widgets: Widget[];
  onPin: (widgetId: string) => void;
  onReorder: (widgets: Widget[]) => void;
}

function SortableWidget({ widget, onPin }: { widget: Widget; onPin: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="relative hover:shadow-lg transition-shadow touch-manipulation">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">{widget.title}</CardTitle>
              <CardDescription className="text-xs sm:text-sm line-clamp-2">{widget.description}</CardDescription>
            </div>
            <Button
              variant={widget.isPinned ? "default" : "outline"}
              size="sm"
              onClick={() => onPin(widget.id)}
              className="shrink-0"
            >
              {widget.isPinned ? 'Unpin' : 'Pin'}
            </Button>
          </div>
          <div {...listeners} className="absolute top-2 right-2 cursor-grab active:cursor-grabbing touch-none p-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

export function WidgetPin({ widgets, onPin, onReorder }: WidgetPinProps) {
  const [items, setItems] = useState(widgets);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((w) => w.id === active.id);
      const newIndex = prev.findIndex((w) => w.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      onReorder(reordered);
      return reordered;
    });
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((w) => w.id)}>
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4"
          data-testid="yallbrary-widget-grid"
        >
          {items.map((widget) => (
            <SortableWidget key={widget.id} widget={widget} onPin={onPin} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
