/**
 * Platform Suggestion Form
 * 
 * Allows users to suggest new categories, tools, or features
 */

import { useState } from 'react';
import { usePersonalization } from '@/hooks/usePersonalization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export function SuggestionForm() {
  const [type, setType] = useState('marketplace_category');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { submitSuggestion } = usePersonalization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) return;

    setSubmitting(true);
    try {
      await submitSuggestion(type, title, description);
      setTitle('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Suggest a Feature
        </CardTitle>
        <CardDescription>
          Help shape the platform! Your suggestions are analyzed by AI and may become reality.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Suggestion Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketplace_category">Marketplace Category</SelectItem>
                <SelectItem value="business_tool">Business Tool</SelectItem>
                <SelectItem value="profile_tab">Profile Tab</SelectItem>
                <SelectItem value="feature">Platform Feature</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Equine Rehabilitation Equipment"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you'd like to see and why it would be useful..."
              rows={4}
              required
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Submit Suggestion'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
