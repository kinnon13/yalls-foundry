import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Brain, Merge, File, FolderTree, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ThreeMemorySystems() {
  const { session } = useSession();
  const { toast } = useToast();
  const [userMemories, setUserMemories] = useState<any[]>([]);
  const [andyMemories, setAndyMemories] = useState<any[]>([]);
  const [combinedFiles, setCombinedFiles] = useState<any[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    if (!session?.userId) return;
    loadAll();
  }, [session?.userId]);

  const loadAll = async () => {
    if (!session?.userId) return;

    const [userMem, andyRes, combined] = await Promise.all([
      supabase
        .from('rocker_long_memory')
        .select('*')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('andy_research')
        .select('*')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('combined_memory_files')
        .select('*')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    setUserMemories(userMem.data || []);
    setAndyMemories(andyRes.data || []);
    setCombinedFiles(combined.data || []);
  };

  const triggerMerge = async () => {
    if (!session?.userId) return;

    setIsMerging(true);
    try {
      const { data, error } = await supabase.functions.invoke('andy-merge-memories', {
        body: { user_id: session.userId }
      });

      if (error) throw error;

      toast({
        title: '🔀 Memories merged!',
        description: `Created ${data.files_created} combined files from ${data.categories} categories`
      });

      await loadAll();
    } catch (error: any) {
      toast({ title: 'Merge failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsMerging(false);
    }
  };

  // Build file tree from combined files
  const buildFileTree = (files: any[]) => {
    const root = files.filter(f => !f.parent_file_id);
    const children = new Map<string, any[]>();

    files.forEach(f => {
      if (f.parent_file_id) {
        if (!children.has(f.parent_file_id)) {
          children.set(f.parent_file_id, []);
        }
        children.get(f.parent_file_id)!.push(f);
      }
    });

    return { root, children };
  };

  const { root, children } = buildFileTree(combinedFiles);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Three Memory Systems</h2>
        <Button onClick={triggerMerge} disabled={isMerging}>
          {isMerging ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Merge className="h-4 w-4 mr-2" />}
          Merge Memories
        </Button>
      </div>

      <Tabs defaultValue="combined" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="user">
            <User className="h-4 w-4 mr-2" />
            Your Memories ({userMemories.length})
          </TabsTrigger>
          <TabsTrigger value="andy">
            <Brain className="h-4 w-4 mr-2" />
            Andy's Research ({andyMemories.length})
          </TabsTrigger>
          <TabsTrigger value="combined">
            <Merge className="h-4 w-4 mr-2" />
            Combined Files ({combinedFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {userMemories.map(mem => (
                <Card key={mem.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">{mem.kind}</Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{mem.key}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {typeof mem.value === 'string' ? mem.value : JSON.stringify(mem.value).slice(0, 150)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="andy" className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {andyMemories.map(res => (
                <Card key={res.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{res.research_type}</Badge>
                      <CardTitle className="text-base">{res.topic}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(res.content, null, 2).slice(0, 300)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="combined" className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {root.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      No combined files yet. Click "Merge Memories" to create them.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                root.map(file => (
                  <Card key={file.id}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{file.file_path}</CardTitle>
                      </div>
                      <CardDescription>
                        {file.user_memory_ids?.length || 0} user memories + {file.andy_research_ids?.length || 0} Andy research
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {file.merge_reasoning && (
                        <p className="text-xs text-muted-foreground">{file.merge_reasoning}</p>
                      )}

                      {/* Sub-files */}
                      {children.has(file.id) && (
                        <div className="ml-4 mt-2 space-y-1 border-l-2 border-border pl-3">
                          {children.get(file.id)!.map(subFile => (
                            <div key={subFile.id} className="p-2 bg-muted rounded-lg">
                              <div className="flex items-center gap-2">
                                <File className="h-3 w-3" />
                                <span className="text-xs font-medium">{subFile.file_name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {subFile.file_path}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
