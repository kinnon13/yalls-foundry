/**
 * Ticket Class Editor for Events
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

export interface TicketClass {
  key: string;
  title: string;
  price_cents: number;
  available: number;
}

interface TicketClassEditorProps {
  value: TicketClass[];
  onChange: (classes: TicketClass[]) => void;
}

export function TicketClassEditor({ value, onChange }: TicketClassEditorProps) {
  const [classes, setClasses] = useState<TicketClass[]>(value);

  const handleAdd = () => {
    const newClass: TicketClass = {
      key: `class_${Date.now()}`,
      title: '',
      price_cents: 0,
      available: 0,
    };
    const updated = [...classes, newClass];
    setClasses(updated);
    onChange(updated);
  };

  const handleUpdate = (index: number, field: keyof TicketClass, val: any) => {
    const updated = [...classes];
    updated[index] = { ...updated[index], [field]: val };
    setClasses(updated);
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = classes.filter((_, i) => i !== index);
    setClasses(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Ticket Classes</Label>
        <Button onClick={handleAdd} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {classes.map((cls, i) => (
        <Card key={cls.key}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor={`title-${i}`}>Title</Label>
                  <Input
                    id={`title-${i}`}
                    value={cls.title}
                    onChange={(e) => handleUpdate(i, 'title', e.target.value)}
                    placeholder="e.g. General Admission"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`price-${i}`}>Price ($)</Label>
                    <Input
                      id={`price-${i}`}
                      type="number"
                      value={cls.price_cents / 100}
                      onChange={(e) => handleUpdate(i, 'price_cents', parseFloat(e.target.value) * 100)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`available-${i}`}>Available</Label>
                    <Input
                      id={`available-${i}`}
                      type="number"
                      value={cls.available}
                      onChange={(e) => handleUpdate(i, 'available', parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(i)}
                className="ml-2"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {classes.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No ticket classes yet. Click "Add Class" to create one.
        </p>
      )}
    </div>
  );
}
