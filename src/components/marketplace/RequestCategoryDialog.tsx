/**
 * Request Category Dialog
 * 
 * Allows users to request new categories via AI
 */

import { useState } from 'react';
import { usePersonalization } from '@/hooks/usePersonalization';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

export function RequestCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [parentCategory, setParentCategory] = useState('agriculture');
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { submitSuggestion } = usePersonalization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName || !description) return;

    setSubmitting(true);
    try {
      await submitSuggestion(
        'marketplace_category',
        categoryName,
        description,
        {
          parent_category: parentCategory,
          filters: [],
        }
      );
      
      setCategoryName('');
      setDescription('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Request Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request New Category</DialogTitle>
          <DialogDescription>
            Can't find what you're looking for? Our AI will review your request and may add it to the marketplace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Category</Label>
            <Select value={parentCategory} onValueChange={setParentCategory}>
              <SelectTrigger id="parent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agriculture">Agriculture</SelectItem>
                <SelectItem value="horse-world">Horse World</SelectItem>
                <SelectItem value="everyday">Everyday & General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Equine Rehabilitation Equipment"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Why is this category needed?</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what products/services would fit in this category and why it would be useful..."
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
