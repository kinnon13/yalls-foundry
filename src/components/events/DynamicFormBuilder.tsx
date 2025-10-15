import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Plus, Trash2, GripVertical } from 'lucide-react';

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  validation?: any;
  help?: string;
}

interface FormSection {
  title: string;
  fieldIds: string[];
}

interface FormSchema {
  fields: FormField[];
  sections: FormSection[];
}

interface DynamicFormBuilderProps {
  eventId: string;
  formType: 'entry' | 'registration' | 'results';
  initialSchema?: FormSchema;
}

export function DynamicFormBuilder({ eventId, formType, initialSchema }: DynamicFormBuilderProps) {
  const [schema, setSchema] = useState<FormSchema>(initialSchema || { fields: [], sections: [] });
  const [eventRules, setEventRules] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerateWithAI = async () => {
    if (!eventRules.trim()) {
      toast.error('Please describe your event rules first');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-event-form', {
        body: { 
          eventRules, 
          formType,
          existingFields: schema.fields.length > 0 ? schema.fields : null
        }
      });

      if (error) throw error;

      setSchema(data.formSchema);
      toast.success('Form generated successfully! Review and customize as needed.');
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Failed to generate form');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('event_form_configs')
        .upsert({
          event_id: eventId,
          form_type: formType,
          config_json: schema,
          ai_generated: true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success('Form configuration saved!');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    };
    setSchema(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const removeField = (fieldId: string) => {
    setSchema(prev => ({
      fields: prev.fields.filter(f => f.id !== fieldId),
      sections: prev.sections.map(s => ({
        ...s,
        fieldIds: s.fieldIds.filter(id => id !== fieldId)
      }))
    }));
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setSchema(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Powered Form Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Describe Your Event Rules & Requirements</Label>
            <Textarea
              value={eventRules}
              onChange={(e) => setEventRules(e.target.value)}
              placeholder="Example: Youth barrel racing, ages 8-18, must provide birth certificate, AQHA registered horses only, $50 entry fee, Pink Buckle eligible..."
              rows={5}
            />
          </div>
          <Button 
            onClick={handleGenerateWithAI} 
            disabled={generating}
            className="w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Form with AI'}
          </Button>
        </CardContent>
      </Card>

      {schema.fields.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Form Fields</CardTitle>
              <Button onClick={addField} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {schema.fields.map((field) => (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label>Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateField(field.id, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="time">Time</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="file">File Upload</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label>Help Text</Label>
                        <Input
                          value={field.help || ''}
                          onChange={(e) => updateField(field.id, { help: e.target.value })}
                          placeholder="Optional help text for users"
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {schema.fields.length > 0 && (
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Form Configuration'}
        </Button>
      )}
    </div>
  );
}
