import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FolderOpen, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LibraryFile {
  id: string;
  name: string;
  summary: string;
  category: string;
  folder_path: string;
  tags: string[];
  starred: boolean;
  created_at: string;
}

const CATEGORIES = [
  'All', 'Projects', 'People', 'Finance', 'Legal', 
  'Marketing', 'Product', 'Personal', 'Notes'
];

export function SuperAndyLibrary() {
  const { toast } = useToast();
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, [activeCategory]);

  const loadLibrary = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('rocker_files')
        .select('id, name, summary, category, folder_path, tags, starred, created_at')
        .eq('status', 'filed')
        .order('created_at', { ascending: false });

      if (activeCategory !== 'All') {
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Failed to load library:', error);
      toast({
        title: 'Failed to load library',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      file.name.toLowerCase().includes(query) ||
      file.summary?.toLowerCase().includes(query) ||
      file.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const groupedFiles = filteredFiles.reduce((acc, file) => {
    const folder = file.folder_path || file.category || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(file);
    return acc;
  }, {} as Record<string, LibraryFile[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map(cat => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-6 pr-4">
          {Object.entries(groupedFiles).map(([folder, folderFiles]) => (
            <div key={folder}>
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{folder}</h3>
                <Badge variant="secondary">{folderFiles.length}</Badge>
              </div>

              <div className="space-y-2 pl-7">
                {folderFiles.map(file => (
                  <Card key={file.id} className="p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {file.starred && (
                            <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
                          )}
                          <h4 className="font-medium truncate">{file.name}</h4>
                        </div>
                        {file.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {file.summary}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags?.slice(0, 4).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredFiles.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files in library</p>
              <p className="text-sm mt-1">File items from your inbox to see them here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}