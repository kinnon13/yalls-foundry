/**
 * Filing Analysis Viewer
 * Shows sentence-level categorization decisions for a file
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileSearch, ChevronRight, ExternalLink } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FilingAnalysisViewerProps {
  fileId: string;
  open: boolean;
  onClose: () => void;
}

interface Section {
  index: number;
  content: string;
  section_summary: string;
  primary_topic: string;
  category_path: string;
  confidence: number;
  sentence_breakdown: SentenceAnalysis[];
  research_sources?: ResearchSource[];
}

interface SentenceAnalysis {
  sentence: string;
  belongs_to: string;
  confidence: number;
  reasoning: string;
}

interface ResearchSource {
  query: string;
  summary: string;
  source: string;
  confidence: number;
}

export function FilingAnalysisViewer({ fileId, open, onClose }: FilingAnalysisViewerProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && fileId) {
      loadAnalysis();
    }
  }, [open, fileId]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      // Get the file
      const { data: file, error: fileError } = await supabase
        .from('rocker_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError) throw fileError;

      // Get the deep analysis if it exists
      const { data: deepAnalysis, error: analysisError } = await supabase
        .from('rocker_deep_analysis')
        .select('*')
        .eq('thread_id', file.thread_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analysisError && analysisError.code !== 'PGRST116') {
        console.error('Error loading analysis:', analysisError);
      }

      setAnalysis({
        file,
        deepAnalysis: deepAnalysis || null
      });
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Filing Analysis: {analysis?.file?.name || 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* File Overview */}
              <Card className="p-4 bg-muted/50">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Project</p>
                      <p className="font-semibold">{analysis.file.project || 'Uncategorized'}</p>
                    </div>
                    <Badge variant="outline">{analysis.file.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category Path</p>
                    <p className="font-mono text-sm">{analysis.file.folder_path || analysis.file.category}</p>
                  </div>
                  {analysis.file.tags && analysis.file.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.file.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Deep Analysis Sections */}
              {analysis.deepAnalysis?.sections && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileSearch className="h-4 w-4" />
                    Sentence-Level Analysis ({analysis.deepAnalysis.sections.length} sections)
                  </h3>
                  
                  <Accordion type="single" collapsible className="space-y-2">
                    {analysis.deepAnalysis.sections.map((section: Section, sIdx: number) => (
                      <AccordionItem key={sIdx} value={`section-${sIdx}`} className="border rounded-lg">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3 text-left">
                              <Badge variant={getConfidenceBadge(section.confidence)}>
                                {Math.round(section.confidence * 100)}%
                              </Badge>
                              <div>
                                <p className="font-medium">{section.primary_topic}</p>
                                <p className="text-xs text-muted-foreground font-mono mt-1">
                                  {section.category_path}
                                </p>
                              </div>
                            </div>
                            {section.research_sources && section.research_sources.length > 0 && (
                              <Badge variant="outline" className="ml-2">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Researched
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-3">
                          {/* Section Summary */}
                          <div className="bg-muted/50 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">Section Summary</p>
                            <p className="text-sm">{section.section_summary}</p>
                          </div>

                          {/* Research Sources */}
                          {section.research_sources && section.research_sources.length > 0 && (
                            <div className="border-l-2 border-blue-500 pl-3 py-2">
                              <p className="text-xs font-semibold text-blue-600 mb-2">
                                🔍 Web Research Performed
                              </p>
                              {section.research_sources.map((research: ResearchSource, rIdx: number) => (
                                <div key={rIdx} className="text-xs space-y-1 mb-2">
                                  <p className="font-mono text-muted-foreground">Query: {research.query}</p>
                                  <p className="text-muted-foreground">{research.summary}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sentence Breakdown */}
                          {section.sentence_breakdown && section.sentence_breakdown.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold mb-2">Sentence-Level Categorization:</p>
                              <div className="space-y-2">
                                {section.sentence_breakdown.map((sent: SentenceAnalysis, sentIdx: number) => (
                                  <div
                                    key={sentIdx}
                                    className="border-l-2 pl-3 py-2 text-sm"
                                    style={{
                                      borderColor: sent.confidence >= 0.8 ? '#22c55e' :
                                                   sent.confidence >= 0.6 ? '#eab308' : '#ef4444'
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <p className="text-xs text-muted-foreground italic">
                                        "{sent.sentence}"
                                      </p>
                                      <Badge
                                        variant={getConfidenceBadge(sent.confidence)}
                                        className="text-xs shrink-0"
                                      >
                                        {Math.round(sent.confidence * 100)}%
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                      <span className="font-mono">{sent.belongs_to}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 ml-5">
                                      {sent.reasoning}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* Filing Options if available */}
              {analysis.deepAnalysis?.filing_options && analysis.deepAnalysis.filing_options.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Original Filing Options Presented:</h3>
                  <div className="space-y-2">
                    {analysis.deepAnalysis.filing_options.map((option: any, i: number) => (
                      <Card key={i} className="p-3 border-l-4 border-primary">
                        <p className="font-medium mb-1">{option.label}</p>
                        <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                        {option.files && (
                          <div className="text-xs space-y-1">
                            {option.files.map((f: any, fIdx: number) => (
                              <div key={fIdx} className="font-mono text-muted-foreground">
                                {f.name} → {f.path}
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {!analysis.deepAnalysis && (
                <Card className="p-4 text-center text-muted-foreground">
                  <FileSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No deep analysis available for this file.</p>
                  <p className="text-xs mt-1">It may have been filed using basic categorization.</p>
                </Card>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
