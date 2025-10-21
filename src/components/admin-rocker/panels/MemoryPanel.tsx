/**
 * Admin Rocker Memory Panel
 * Private admin memory storage and notes
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Search, Plus, Lock, Edit, Trash2, Share2 } from 'lucide-react';

export function MemoryPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const memories = [
    {
      id: 1,
      title: 'Q1 User Growth Strategy',
      content: 'Focus on farm management features and stallion listings. Target demographic: 25-45 year old farm owners...',
      tags: ['strategy', 'growth', 'q1'],
      isPrivate: true,
      sharedWith: [],
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
    {
      id: 2,
      title: 'Platform Security Notes',
      content: 'Recent security audit findings and remediation plans. Priority: implement 2FA for all admin accounts...',
      tags: ['security', 'urgent'],
      isPrivate: true,
      sharedWith: ['admin2@example.com'],
      createdAt: '2024-01-18',
      updatedAt: '2024-01-19',
    },
    {
      id: 3,
      title: 'MLM Campaign Ideas',
      content: 'Brainstorming for Q2 referral incentives. Consider tiered rewards and gamification elements...',
      tags: ['marketing', 'mlm', 'ideas'],
      isPrivate: false,
      sharedWith: ['marketing@example.com', 'admin2@example.com'],
      createdAt: '2024-01-10',
      updatedAt: '2024-01-17',
    },
  ];

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Memory Storage</h1>
          <p className="text-muted-foreground mt-1">
            Secure vault for admin notes, strategies, and sensitive information
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Memory
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create New Memory Form */}
      {isCreating && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Create New Memory
            </CardTitle>
            <CardDescription>
              Store secure notes and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="Enter memory title..." />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea 
                placeholder="Enter your notes, strategies, or information..." 
                className="min-h-[120px]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input placeholder="strategy, notes, urgent (comma-separated)" />
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="private" className="rounded" defaultChecked />
              <label htmlFor="private" className="text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Keep private (only visible to you)
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button>Save Memory</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory List */}
      <div className="space-y-4">
        {memories.map((memory) => (
          <Card key={memory.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{memory.title}</h3>
                    {memory.isPrivate && (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Private
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {memory.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {memory.content}
              </p>
              
              <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                <div className="space-y-1">
                  <div>Created: {memory.createdAt}</div>
                  <div>Updated: {memory.updatedAt}</div>
                </div>
                
                {memory.sharedWith.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Share2 className="h-3 w-3" />
                    <span>Shared with {memory.sharedWith.length} admin(s)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Storage Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-sm">Total Memories</span>
            <span className="font-semibold">24</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-sm">Private Memories</span>
            <span className="font-semibold">16</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-sm">Shared Memories</span>
            <span className="font-semibold">8</span>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-sm">Storage Used</span>
            <span className="font-semibold">2.4 MB / 100 MB</span>
          </div>
        </CardContent>
      </Card>

      {/* Auto-organize Suggestion */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Organization Suggestions
          </CardTitle>
          <CardDescription>
            Proactive memory management recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Outdated memories detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              5 memories haven't been updated in 90+ days - archive or update?
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Review Old Memories
            </Button>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Similar memories found</p>
            <p className="text-xs text-muted-foreground mt-1">
              "Q1 Strategy" and "Marketing Plans Q1" appear related - merge?
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              View Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
