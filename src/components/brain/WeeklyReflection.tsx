/**
 * Weekly Memory Reflection
 * Displays Andy's weekly journal entry about his learning
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const WeeklyReflection: React.FC = () => {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['brain-reflections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('brain_reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) return <div className="text-gray-400 text-sm">Loading reflection...</div>;

  const latest = reports?.[0];
  if (!latest) return (
    <div className="mt-6 bg-black/40 p-4 rounded border border-gray-700 text-gray-400 text-sm">
      No reflections yet. Andy will generate his first weekly reflection soon.
    </div>
  );

  return (
    <div className="mt-6 bg-black/40 p-4 rounded border border-gray-700">
      <h2 className="text-emerald-400 text-lg font-bold mb-2 flex items-center gap-2">
        🧩 Weekly Memory Reflection
        <span className="text-xs text-gray-400 font-normal">
          {new Date(latest.report_date).toLocaleDateString()}
        </span>
      </h2>
      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
        {latest.summary}
      </p>
      <div className="flex gap-4 text-xs text-gray-500 mt-3">
        <span>💪 Reinforced: {latest.reinforced_count}</span>
        <span>📉 Decayed: {latest.decayed_count}</span>
        <span>✨ New: {latest.new_insights}</span>
      </div>
    </div>
  );
};
