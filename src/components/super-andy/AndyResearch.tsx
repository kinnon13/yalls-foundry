import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, FileSearch, GitBranch, Clock, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AndyResearchItem {
  id: string;
  research_type: string;
  topic: string;
  content: any;
  created_at: string;
  metadata?: any;
}

interface AndyEnhancement {
  id: string;
  enhancement_type: string;
  original_content: string;
  enhanced_content: any;
  reasoning: string;
  created_at: string;
  confidence: number;
}

interface AndyLearning {
  id: string;
  learned_at: string;
  learning_type: string;
  what_learned: string;
  from_content: string;
  confidence: number;
  applied_count: number;
}

export function AndyResearch() {
  const { session } = useSession();
  const [research, setResearch] = useState<AndyResearchItem[]>([]);
  const [enhancements, setEnhancements] = useState<AndyEnhancement[]>([]);
  const [learnings, setLearnings] = useState<AndyLearning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.userId) return;
    loadAndyData();
  }, [session?.userId]);

  const loadAndyData = async () => {
    if (!session?.userId) return;
    
    setLoading(true);
    try {
      const [resData, enhData, learnData] = await Promise.all([
        supabase
          .from('andy_research')
          .select('*')
          .eq('user_id', session.userId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('andy_memory_enhancements')
          .select('*')
          .eq('user_id', session.userId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('andy_learning_log')
          .select('*')
          .eq('user_id', session.userId)
          .order('learned_at', { ascending: false })
          .limit(100)
      ]);

      setResearch(resData.data || []);
      setEnhancements(enhData.data || []);
      setLearnings(learnData.data || []);
    } catch (error) {
      console.error('Failed to load Andy data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading Andy's brain...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Andy's Research & Learning</h2>
      </div>

      <Tabs defaultValue="research" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="research">
            <FileSearch className="h-4 w-4 mr-2" />
            Research Files ({research.length})
          </TabsTrigger>
          <TabsTrigger value="enhancements">
            <Target className="h-4 w-4 mr-2" />
            Memory Enhancements ({enhancements.length})
          </TabsTrigger>
          <TabsTrigger value="learnings">
            <GitBranch className="h-4 w-4 mr-2" />
            Learning Log ({learnings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="research" className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {research.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      Andy hasn't created any research files yet. They'll appear as he analyzes your memories.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                research.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.research_type}</Badge>
                            <CardTitle className="text-base">{item.topic}</CardTitle>
                          </div>
                          <CardDescription className="flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {new Date(item.created_at).toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {item.content?.angles && (
                          <div>
                            <strong className="text-xs text-muted-foreground">Research Angles:</strong>
                            <ul className="list-disc list-inside ml-2 mt-1">
                              {item.content.angles.map((angle: string, i: number) => (
                                <li key={i}>{angle}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.content?.insights && (
                          <div>
                            <strong className="text-xs text-muted-foreground">Insights:</strong>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(item.content.insights, null, 2)}
                            </pre>
                          </div>
                        )}
                        {item.content?.context && (
                          <div>
                            <strong className="text-xs text-muted-foreground">Context:</strong>
                            <p className="text-xs text-muted-foreground mt-1">{item.content.context}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="enhancements" className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {enhancements.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      No memory enhancements yet. Andy will enhance your memories with categories and connections.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                enhancements.map((enh) => (
                  <Card key={enh.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{enh.enhancement_type}</Badge>
                            <Badge variant="secondary">{Math.round(enh.confidence * 100)}% confident</Badge>
                          </div>
                          <CardDescription className="flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {new Date(enh.created_at).toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div>
                          <strong className="text-xs text-muted-foreground">Original:</strong>
                          <p className="text-xs mt-1 p-2 bg-muted/50 rounded">{enh.original_content}</p>
                        </div>
                        
                        {enh.enhanced_content?.categories && (
                          <div>
                            <strong className="text-xs text-muted-foreground">Categories:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge variant="default">{enh.enhanced_content.categories.primary}</Badge>
                              {enh.enhanced_content.categories.micro?.map((cat: string, i: number) => (
                                <Badge key={i} variant="secondary">{cat}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {enh.enhanced_content?.connections && enh.enhanced_content.connections.length > 0 && (
                          <div>
                            <strong className="text-xs text-muted-foreground">Connections:</strong>
                            <ul className="list-disc list-inside ml-2 mt-1 text-xs">
                              {enh.enhanced_content.connections.map((conn: any, i: number) => (
                                <li key={i}>{conn.to} ({conn.type})</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div>
                          <strong className="text-xs text-muted-foreground">Andy's Reasoning:</strong>
                          <p className="text-xs text-muted-foreground mt-1">{enh.reasoning}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="learnings" className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {learnings.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      Andy's learning log is empty. He'll record patterns and insights as he processes your memories.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                learnings.map((learn) => (
                  <Card key={learn.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start gap-3">
                        <Brain className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{learn.learning_type}</Badge>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(learn.confidence * 100)}% confident
                            </Badge>
                            <Badge variant="default" className="text-xs">
                              Used {learn.applied_count}× 
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{learn.what_learned}</p>
                          <p className="text-xs text-muted-foreground">
                            From: {learn.from_content.slice(0, 100)}...
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(learn.learned_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
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
