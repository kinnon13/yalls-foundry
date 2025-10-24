/**
 * Memory Recall Timeline
 * Displays chronological recall and strength trends
 */

import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface MemoryEvent {
  id: string;
  title: string;
  memory_strength: number;
  last_recalled_at: string;
  created_at: string;
}

interface MemoryTimelineProps {
  insights: MemoryEvent[];
}

export const MemoryTimeline: React.FC<MemoryTimelineProps> = ({ insights }) => {
  const sorted = [...insights].sort(
    (a, b) => new Date(a.last_recalled_at).getTime() - new Date(b.last_recalled_at).getTime()
  );

  const data = sorted.map((m) => ({
    name: m.title.slice(0, 20),
    strength: parseFloat((m.memory_strength * 100).toFixed(1)),
    date: new Date(m.last_recalled_at).toLocaleDateString(),
  }));

  return (
    <div className="w-full mt-6">
      <h2 className="text-emerald-400 text-lg font-bold mb-3">
        🧠 Memory Recall Timeline
      </h2>
      <div className="bg-black/50 p-4 rounded border border-gray-700 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" tick={{ fill: "#aaa", fontSize: 10 }} />
            <YAxis domain={[0, 100]} stroke="#888" tick={{ fill: "#aaa", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", color: "#fff" }}
              labelStyle={{ color: "#00ff7f" }}
            />
            <Line
              type="monotone"
              dataKey="strength"
              stroke="#00ff7f"
              strokeWidth={2}
              dot={{ r: 3, fill: "#00ff7f" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>Earlier →</span>
        <span>→ More Recent</span>
      </div>
    </div>
  );
};
