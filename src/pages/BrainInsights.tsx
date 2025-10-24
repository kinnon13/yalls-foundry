/**
 * Brain Insights Dashboard
 * Displays Andy's memory health, timeline, and reflections
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MemoryHeatmap } from "@/components/brain/MemoryHeatmap";
import { MemoryTimeline } from "@/components/brain/MemoryTimeline";
import { WeeklyReflection } from "@/components/brain/WeeklyReflection";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function BrainInsights() {
  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['brain-insights'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('brain_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading Andy's brain insights...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">
              🧠 Andy's Brain Insights
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Long-term memory, learning patterns, and cognitive health
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <WeeklyReflection />

        {insights && insights.length > 0 ? (
          <>
            <MemoryHeatmap insights={insights} />
            <MemoryTimeline insights={insights} />

            <div className="space-y-4">
              <h2 className="text-emerald-400 text-lg font-bold">All Insights</h2>
              <div className="grid gap-3">
                {insights.map((insight: any) => (
                  <div
                    key={insight.id}
                    className="bg-black/40 p-4 rounded border border-gray-700 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-emerald-300 text-sm">
                        {insight.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(insight.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                      <span>
                        Strength: {(insight.memory_strength * 100).toFixed(0)}%
                      </span>
                      <span>•</span>
                      <span>
                        Last recalled: {new Date(insight.last_recalled_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-gray-300 line-clamp-2 mb-2">
                      {insight.summary}
                    </div>

                    {insight.key_points && Array.isArray(insight.key_points) && (
                      <details className="text-xs mt-2">
                        <summary className="cursor-pointer text-blue-300 hover:text-blue-200">
                          View key points
                        </summary>
                        <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1 ml-2">
                          {insight.key_points.map((point: string, i: number) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-black/40 p-8 rounded border border-gray-700 text-center">
            <p className="text-gray-400 mb-2">No insights yet</p>
            <p className="text-gray-500 text-sm">
              Andy will generate insights as he completes research tasks.
              Create a task using the <code className="px-2 py-1 bg-black/50 rounded">start_research_task</code> tool in chat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
