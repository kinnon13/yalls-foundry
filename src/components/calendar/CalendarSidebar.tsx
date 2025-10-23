import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, FolderOpen, Calendar as CalendarIcon, Share2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Calendar {
  id: string;
  name: string;
  calendar_type: string;
  color: string;
}

interface Collection {
  id: string;
  name: string;
  color: string;
}

interface CalendarSidebarProps {
  selectedCalendarIds: string[];
  selectedCollectionIds: string[];
  onCalendarToggle: (id: string) => void;
  onCollectionToggle: (id: string) => void;
  onRefresh: () => void;
}

export function CalendarSidebar({
  selectedCalendarIds,
  selectedCollectionIds,
  onCalendarToggle,
  onCollectionToggle,
  onRefresh,
}: CalendarSidebarProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Create calendar dialog state
  const [createCalOpen, setCreateCalOpen] = useState(false);
  const [newCalName, setNewCalName] = useState('');
  const [newCalType, setNewCalType] = useState<'personal' | 'business' | 'horse' | 'shared'>('personal');
  const [newCalColor, setNewCalColor] = useState('#3B82F6');

  // Create collection dialog state
  const [createCollOpen, setCreateCollOpen] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [newCollColor, setNewCollColor] = useState('#8B5CF6');
  const [selectedCalsForColl, setSelectedCalsForColl] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load calendars
      const { data: cals, error: calError } = await (supabase as any)
        .from('calendars')
        .select('*')
        .order('name');

      if (calError) throw calError;

      // Load collections
      const { data: colls, error: collError } = await (supabase as any)
        .from('calendar_collections')
        .select('*')
        .order('name');

      if (collError) throw collError;

      setCalendars(cals || []);
      setCollections(colls || []);
    } catch (error) {
      console.error('Failed to load calendars:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendars',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Expose open helpers for Rocker (fallback when click event is intercepted)
  useEffect(() => {
    (window as any).__openCreateCalendar = () => setCreateCalOpen(true);
    (window as any).__openCreateCollection = () => setCreateCollOpen(true);
    return () => {
      delete (window as any).__openCreateCalendar;
      delete (window as any).__openCreateCollection;
    };
  }, []);

  const createCalendar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('calendar-ops', {
        body: {
          operation: 'create_calendar',
          name: newCalName,
          calendar_type: newCalType,
          color: newCalColor,
        },
      });

      if (error) {
        console.error('Calendar creation error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Calendar creation failed:', data.error);
        throw new Error(data.error);
      }

      toast({
        title: 'Calendar created',
        description: `${newCalName} has been created`,
      });

      // EMIT EVENT: Notify Rocker of calendar creation
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { rockerEvents } = await import('@/lib/rocker-events');
          await rockerEvents.createCalendar(user.id, {
            calendar_id: data?.calendar?.id,
            name: newCalName,
            type: newCalType,
          });
        }
      } catch (emitError) {
        console.error('[EventBus] Failed to emit event:', emitError);
      }

      setNewCalName('');
      setNewCalType('personal');
      setNewCalColor('#3B82F6');
      setCreateCalOpen(false);
      loadData();
      onRefresh();
    } catch (error) {
      console.error('Failed to create calendar:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create calendar',
        variant: 'destructive',
      });
    }
  };

  const createCollection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('calendar-ops', {
        body: {
          operation: 'create_collection',
          name: newCollName,
          color: newCollColor,
          calendar_ids: selectedCalsForColl,
        },
      });

      if (error) {
        console.error('Collection creation error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Collection creation failed:', data.error);
        throw new Error(data.error);
      }

      toast({
        title: 'Collection created',
        description: `${newCollName} has been created`,
      });

      setNewCollName('');
      setNewCollColor('#8B5CF6');
      setSelectedCalsForColl([]);
      setCreateCollOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to create collection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create collection',
        variant: 'destructive',
      });
    }
  };

  const deleteCalendar = async (id: string, name: string) => {
    if (!confirm(`Delete calendar "${name}"?`)) return;

    try {
      const { error } = await (supabase as any)
        .from('calendars')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Calendar deleted',
        description: `${name} has been deleted`,
      });

      loadData();
      onRefresh();
    } catch (error) {
      console.error('Failed to delete calendar:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete calendar',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="w-64 border-r border-border p-4">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-border flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Calendars Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Calendars
              </h3>
              <Dialog open={createCalOpen} onOpenChange={setCreateCalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-rocker="new calendar button new calendar calendar plus"
                    aria-label="New calendar"
                    title="Add a new calendar"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="z-[100]">
                  <DialogHeader>
                    <DialogTitle>Create Calendar</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="calendar-name">Name</Label>
                      <Input
                        id="calendar-name"
                        value={newCalName}
                        onChange={(e) => setNewCalName(e.target.value)}
                        placeholder="My Calendar"
                        aria-label="calendar name"
                        name="calendar-name"
                        data-rocker="calendar name"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={newCalType} onValueChange={(v: any) => setNewCalType(v)}>
                        <SelectTrigger data-rocker="calendar type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[101]">
                          <SelectItem value="personal" data-rocker="calendar type personal">Personal</SelectItem>
                          <SelectItem value="business" data-rocker="calendar type business">Business</SelectItem>
                          <SelectItem value="horse" data-rocker="calendar type horse">Horse</SelectItem>
                          <SelectItem value="shared" data-rocker="calendar type shared">Shared</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Color</Label>
                      <Input
                        type="color"
                        value={newCalColor}
                        onChange={(e) => setNewCalColor(e.target.value)}
                        aria-label="calendar color"
                        name="calendar-color"
                        data-rocker="calendar color"
                      />
                    </div>
                      <Button onClick={createCalendar} className="w-full" data-rocker="create calendar submit" aria-label="save calendar">
                        Create Calendar
                      </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {calendars.map((cal) => (
                <div key={cal.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={selectedCalendarIds.includes(cal.id)}
                    onCheckedChange={() => onCalendarToggle(cal.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cal.color }}
                  />
                  <span className="text-sm flex-1 truncate">{cal.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={() => deleteCalendar(cal.id, cal.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Collections Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Collections
              </h3>
              <Dialog open={createCollOpen} onOpenChange={setCreateCollOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" data-rocker="create collection new collection collection plus" aria-label="New collection">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="z-[100]">
                  <DialogHeader>
                    <DialogTitle>Create Collection</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newCollName}
                        onChange={(e) => setNewCollName(e.target.value)}
                        placeholder="Master Calendar"
                        data-rocker="collection name"
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <Input
                        type="color"
                        value={newCollColor}
                        onChange={(e) => setNewCollColor(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Include Calendars</Label>
                      <div className="space-y-2 mt-2">
                        {calendars.map((cal) => (
                          <div key={cal.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedCalsForColl.includes(cal.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCalsForColl([...selectedCalsForColl, cal.id]);
                                } else {
                                  setSelectedCalsForColl(
                                    selectedCalsForColl.filter((id) => id !== cal.id)
                                  );
                                }
                              }}
                            />
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cal.color }}
                            />
                            <span className="text-sm">{cal.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={createCollection} className="w-full" data-rocker="create collection submit">
                      Create Collection
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {collections.map((coll) => (
                <div key={coll.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCollectionIds.includes(coll.id)}
                    onCheckedChange={() => onCollectionToggle(coll.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: coll.color }}
                  />
                  <span className="text-sm flex-1 truncate">{coll.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
