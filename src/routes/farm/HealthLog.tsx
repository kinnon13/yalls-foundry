import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

const HEALTH_KINDS = [
  { value: 'observation', label: 'Observation' },
  { value: 'medication', label: 'Medication' },
  { value: 'injury', label: 'Injury' },
  { value: 'farrier', label: 'Farrier' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'vet_visit', label: 'Vet Visit' },
  { value: 'dental', label: 'Dental' },
];

type LocalEntry = {
  id: string;
  kind: string;
  note: string;
  timestamp: string;
};

export default function HealthLog() {
  const [note, setNote] = useState('');
  const [kind, setKind] = useState('observation');
  const [entries, setEntries] = useState<LocalEntry[]>([]);

  const addEntry = () => {
    if (!note.trim()) return;
    
    const newEntry: LocalEntry = {
      id: crypto.randomUUID(),
      kind,
      note,
      timestamp: new Date().toISOString(),
    };
    
    setEntries([newEntry, ...entries]);
    setNote('');
    setKind('observation');
  };

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Health Log</h1>
      </div>

      <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> This is a demo health log stored locally. 
            For production use, connect to your database backend.
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3">
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger>
              <SelectValue placeholder="Select entry type" />
            </SelectTrigger>
            <SelectContent>
              {HEALTH_KINDS.map(k => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && note) {
                addEntry();
              }
            }}
          />

          <div className="flex justify-end">
            <Button disabled={!note} onClick={addEntry}>
              Log Entry
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {entries.map(e => (
          <Card key={e.id} className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {HEALTH_KINDS.find(k => k.value === e.kind)?.label || e.kind}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(e.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm">{e.note}</div>
              </div>
            </div>
          </Card>
        ))}

        {entries.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No health entries yet. Log your first entry above.
          </div>
        )}
      </div>
    </div>
  );
}
