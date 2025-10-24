/**
 * Andy Notebook - Where Andy writes reports, findings, and suggestions
 * Real-time updates via Supabase realtime
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Plus, Archive, CheckCircle, AlertCircle, 
  Lightbulb, Search, Filter, X 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AndyNote {
  id: string;
  topic: string;
  title: string;
  content: string;
  note_type: 'report' | 'finding' | 'suggestion' | 'analysis';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'archived' | 'completed';
  tags: string[];
  created_at: string;
  updated_at: string;
}

const NoteTypeIcons = {
  report: FileText,
  finding: AlertCircle,
  suggestion: Lightbulb,
  analysis: Search,
};

const PriorityColors = {
  low: 'bg-secondary',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-destructive',
};

export function AndyNotebook() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<AndyNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<AndyNote | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadNotes();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('andy-notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'andy_notes',
        },
        () => {
          loadNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterType, filterStatus]);

  const loadNotes = async () => {
    try {
      let query = supabase
        .from('andy_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('note_type', filterType);
      }
      
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNotes((data || []) as AndyNote[]);
    } catch (error: any) {
      console.error('Failed to load notes:', error);
    }
  };

  const generateNote = async (topic: string) => {
    if (!topic.trim()) {
      toast({
        title: 'Topic required',
        description: 'Enter a topic for Andy to research',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('andy-write-note', {
        body: { topic: topic.trim() }
      });

      if (error) throw error;
      
      toast({
        title: '✅ Andy wrote a note',
        description: data.title,
      });
      
      await loadNotes();
    } catch (error: any) {
      toast({
        title: 'Failed to generate note',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateNoteStatus = async (noteId: string, status: AndyNote['status']) => {
    try {
      const { error } = await supabase
        .from('andy_notes')
        .update({ status })
        .eq('id', noteId);

      if (error) throw error;
      toast({ title: `Note ${status}` });
    } catch (error: any) {
      toast({
        title: 'Failed to update note',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('andy_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      setSelectedNote(null);
      toast({ title: 'Note deleted' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete note',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const activeNotes = notes.filter(n => n.status === 'active');

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Sidebar - Note List */}
      <div className="col-span-1 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask Andy to write about..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                generateNote(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <Button
            size="icon"
            disabled={isGenerating}
            onClick={() => {
              const input = document.querySelector('input[placeholder*="Ask Andy"]') as HTMLInputElement;
              if (input?.value) {
                generateNote(input.value);
                input.value = '';
              }
            }}
          >
            {isGenerating ? '...' : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex gap-2 text-xs">
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('active')}
          >
            Active
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('completed')}
          >
            Done
          </Button>
          <Button
            variant={filterStatus === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('archived')}
          >
            Archived
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {notes.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
                <p className="text-xs mt-1">Ask Andy to write about a topic</p>
              </div>
            )}
            
            {notes.map((note) => {
              const Icon = NoteTypeIcons[note.note_type];
              return (
                <div
                  key={note.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedNote?.id === note.id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{note.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{note.topic}</p>
                      <div className="flex gap-1 mt-2">
                        <Badge className={`text-xs ${PriorityColors[note.priority]}`}>
                          {note.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {note.note_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(note.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Panel - Note Detail */}
      <div className="col-span-2 border rounded-lg p-4">
        {selectedNote ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{selectedNote.title}</h2>
                <p className="text-sm text-muted-foreground">{selectedNote.topic}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedNote(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Badge className={PriorityColors[selectedNote.priority]}>
                {selectedNote.priority}
              </Badge>
              <Badge variant="outline">{selectedNote.note_type}</Badge>
              <Badge variant="secondary">{selectedNote.status}</Badge>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {selectedNote.content}
                </pre>
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              {selectedNote.status === 'active' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateNoteStatus(selectedNote.id, 'completed')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateNoteStatus(selectedNote.id, 'archived')}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                </>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteNote(selectedNote.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a note to view</p>
              <p className="text-sm mt-1">Or ask Andy to write something new</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
