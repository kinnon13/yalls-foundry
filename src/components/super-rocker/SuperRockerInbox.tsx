import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  Archive, 
  Tag, 
  Edit2, 
  CheckSquare, 
  MoreVertical,
  FolderPlus,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface InboxFile {
  id: string;
  name: string;
  summary: string;
  category: string;
  tags: string[];
  starred: boolean;
  created_at: string;
}

const CATEGORIES = [
  'Projects', 'People', 'Finance', 'Legal', 
  'Marketing', 'Product', 'Personal', 'Notes'
];

export function SuperRockerInbox() {
  const { toast } = useToast();
  const [files, setFiles] = useState<InboxFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const loadInbox = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rocker_files')
        .select('id, name, summary, category, tags, starred, created_at')
        .eq('status', 'inbox')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Failed to load inbox:', error);
      toast({
        title: 'Failed to load inbox',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const toggleStar = async (id: string, currentStarred: boolean) => {
    try {
      const { error } = await supabase
        .from('rocker_files')
        .update({ starred: !currentStarred })
        .eq('id', id);

      if (error) throw error;
      await loadInbox();
    } catch (error: any) {
      toast({
        title: 'Failed to star',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fileItem = async (id: string, category: string) => {
    try {
      const folderPath = `${category}`;
      const { error } = await supabase
        .from('rocker_files')
        .update({ 
          status: 'filed',
          folder_path: folderPath
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: `Filed to ${category}` });
      await loadInbox();
    } catch (error: any) {
      toast({
        title: 'Failed to file',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const bulkFile = async (category: string) => {
    if (selected.size === 0) return;

    try {
      const updates = Array.from(selected).map(id =>
        supabase
          .from('rocker_files')
          .update({ 
            status: 'filed',
            folder_path: category
          })
          .eq('id', id)
      );

      await Promise.all(updates);
      toast({ title: `Filed ${selected.size} items to ${category}` });
      setSelected(new Set());
      await loadInbox();
    } catch (error: any) {
      toast({
        title: 'Failed to file items',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inbox</h2>
          <p className="text-sm text-muted-foreground">
            {files.length} items need organizing
          </p>
        </div>
        
        {selected.size > 0 && (
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground">
              {selected.size} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  File Selected
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {CATEGORIES.map(cat => (
                  <DropdownMenuItem key={cat} onClick={() => bulkFile(cat)}>
                    {cat}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-4">
          {files.map((file) => (
            <Card 
              key={file.id} 
              className={`p-4 cursor-pointer transition-colors ${
                selected.has(file.id) ? 'border-primary bg-accent/50' : ''
              }`}
              onClick={() => toggleSelect(file.id)}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(file.id)}
                  onChange={() => toggleSelect(file.id)}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold truncate">{file.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {file.summary || 'No summary available'}
                      </p>
                    </div>
                    
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(file.id, file.starred);
                        }}
                      >
                        <Star 
                          className={`h-4 w-4 ${file.starred ? 'fill-primary text-primary' : ''}`} 
                        />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {CATEGORIES.map(cat => (
                            <DropdownMenuItem 
                              key={cat} 
                              onClick={() => fileItem(file.id, cat)}
                            >
                              <FolderPlus className="h-4 w-4 mr-2" />
                              File to {cat}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {file.category}
                    </Badge>
                    {file.tags?.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {files.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inbox is empty!</p>
              <p className="text-sm mt-1">Upload files or paste notes to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}