/**
 * Tour Schedule Management Panel
 * 
 * Allows admins to create and manage automated tour schedules with custom prompts
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Save, X, Play } from 'lucide-react';
import { platformTour, type TourStop } from '@/lib/ai/rocker/tour';

interface TourSchedule {
  id: string;
  name: string;
  description: string | null;
  stops: TourStop[];
  trigger_event: string | null;
  is_active: boolean;
  created_at: string;
}

interface EditingStop {
  path: string;
  title: string;
  description: string;
  highlights: string[];
  nextPrompt?: string;
}

export function TourSchedulePanel() {
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_event: 'manual',
    is_active: true,
    stops: [] as EditingStop[]
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules((data || []).map(d => ({
        ...d,
        stops: d.stops as unknown as TourStop[]
      })));
    } catch (error) {
      console.error('Error loading tour schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tour schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_event: 'manual',
      is_active: true,
      stops: []
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const startEdit = (schedule: TourSchedule) => {
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      trigger_event: schedule.trigger_event || 'manual',
      is_active: schedule.is_active,
      stops: schedule.stops
    });
    setEditingId(schedule.id);
    setIsCreating(false);
  };

  const saveSchedule = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Tour name is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.stops.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one tour stop is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const scheduleData = {
        name: formData.name,
        description: formData.description || null,
        stops: formData.stops as any,
        trigger_event: formData.trigger_event,
        is_active: formData.is_active
      };

      if (editingId) {
        const { error } = await supabase
          .from('tour_schedules')
          .update(scheduleData)
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: 'Success', description: 'Tour schedule updated' });
      } else {
        const { error } = await supabase
          .from('tour_schedules')
          .insert(scheduleData);

        if (error) throw error;
        toast({ title: 'Success', description: 'Tour schedule created' });
      }

      await loadSchedules();
      resetForm();
    } catch (error) {
      console.error('Error saving tour schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save tour schedule',
        variant: 'destructive',
      });
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tour schedule?')) return;

    try {
      const { error } = await supabase
        .from('tour_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Tour schedule deleted' });
      await loadSchedules();
    } catch (error) {
      console.error('Error deleting tour schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tour schedule',
        variant: 'destructive',
      });
    }
  };

  const addStopFromTemplate = (templateStop: TourStop) => {
    setFormData(prev => ({
      ...prev,
      stops: [...prev.stops, { ...templateStop }]
    }));
  };

  const addCustomStop = () => {
    setFormData(prev => ({
      ...prev,
      stops: [...prev.stops, {
        path: '/',
        title: 'New Stop',
        description: 'Description of this stop',
        highlights: ['Feature 1', 'Feature 2'],
        nextPrompt: 'What would you like to explore next?'
      }]
    }));
  };

  const updateStop = (index: number, field: keyof EditingStop, value: any) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.map((stop, i) => 
        i === index ? { ...stop, [field]: value } : stop
      )
    }));
  };

  const removeStop = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('tour_schedules')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      await loadSchedules();
      toast({ 
        title: 'Success', 
        description: `Tour schedule ${!currentState ? 'activated' : 'deactivated'}` 
      });
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading tour schedules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tour Schedules</h2>
          <p className="text-muted-foreground">Create and manage automated platform tours</p>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Tour
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Tour Schedule' : 'Create Tour Schedule'}</CardTitle>
            <CardDescription>
              Configure a guided tour with multiple stops and custom prompts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tour Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., New User Onboarding Tour"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this tour cover?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger Event</Label>
                <Select
                  value={formData.trigger_event}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_event: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (Say "show me around")</SelectItem>
                    <SelectItem value="onboarding">On User Onboarding</SelectItem>
                    <SelectItem value="first_login">First Login</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            {/* Tour Stops */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <Label className="text-lg">Tour Stops ({formData.stops.length})</Label>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={addCustomStop}>
                    <Plus className="mr-1 h-3 w-3" />
                    Custom Stop
                  </Button>
                </div>
              </div>

              {/* Template Stops */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Add from Templates:</Label>
                <div className="flex flex-wrap gap-2">
                  {platformTour.map((stop) => (
                    <Button
                      key={stop.path}
                      variant="outline"
                      size="sm"
                      onClick={() => addStopFromTemplate(stop)}
                    >
                      {stop.title}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Stops List */}
              <div className="space-y-4">
                {formData.stops.map((stop, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold">Stop {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStop(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        <div className="space-y-1">
                          <Label>Path</Label>
                          <Input
                            value={stop.path}
                            onChange={(e) => updateStop(index, 'path', e.target.value)}
                            placeholder="/route"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label>Title</Label>
                          <Input
                            value={stop.title}
                            onChange={(e) => updateStop(index, 'title', e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label>Description</Label>
                          <Textarea
                            value={stop.description}
                            onChange={(e) => updateStop(index, 'description', e.target.value)}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label>Highlights (comma-separated)</Label>
                          <Textarea
                            value={stop.highlights.join(', ')}
                            onChange={(e) => updateStop(index, 'highlights', e.target.value.split(',').map(s => s.trim()))}
                            rows={2}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label>Next Prompt (optional)</Label>
                          <Input
                            value={stop.nextPrompt || ''}
                            onChange={(e) => updateStop(index, 'nextPrompt', e.target.value)}
                            placeholder="What would you like to explore next?"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={saveSchedule}>
                <Save className="mr-2 h-4 w-4" />
                {editingId ? 'Update' : 'Create'} Tour
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      {!isCreating && !editingId && (
        <div className="grid gap-4">
          {schedules.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No tour schedules yet. Create one to get started!
              </CardContent>
            </Card>
          ) : (
            schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {schedule.name}
                        {!schedule.is_active && (
                          <span className="text-xs px-2 py-1 bg-muted rounded">Inactive</span>
                        )}
                      </CardTitle>
                      {schedule.description && (
                        <CardDescription>{schedule.description}</CardDescription>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {schedule.stops.length} stops • Trigger: {schedule.trigger_event || 'manual'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(schedule.id, schedule.is_active)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(schedule)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSchedule(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tour Stops:</Label>
                    <div className="space-y-1">
                      {schedule.stops.map((stop: TourStop, i: number) => (
                        <div key={i} className="text-sm flex items-center gap-2">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span className="font-medium">{stop.title}</span>
                          <span className="text-muted-foreground">({stop.path})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
