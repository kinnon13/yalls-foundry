/**
 * Memory Health Heatmap
 * Visualizes each insight's memory strength over time
 */

import React from "react";

export interface MemoryInsight {
  id: string;
  title: string;
  memory_strength: number;
  last_recalled_at: string;
  decay_rate: number;
  created_at: string;
}

interface MemoryHeatmapProps {
  insights: MemoryInsight[];
}

export const MemoryHeatmap: React.FC<MemoryHeatmapProps> = ({ insights }) => {
  const now = new Date().getTime();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  return (
    <div className="w-full mt-6">
      <h2 className="text-emerald-400 text-lg font-bold mb-3">
        🧩 Memory Health Heatmap
      </h2>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(12px,1fr))] gap-[2px] bg-black/50 p-2 rounded border border-gray-700 h-32 overflow-hidden">
        {insights.map((mem) => {
          const age = now - new Date(mem.created_at).getTime();
          const normalizedAge = Math.min(age / ninetyDays, 1);
          const strength = mem.memory_strength;
          const recent = new Date(mem.last_recalled_at).getTime();

          const hue = 120 * strength;
          const opacity = Math.max(0.3, 1 - normalizedAge);
          const borderGlow =
            Date.now() - recent < 7 * 24 * 60 * 60 * 1000 ? "0 0 5px #00ff7f" : "none";

          return (
            <div
              key={mem.id}
              title={`${mem.title}\nStrength ${(strength * 100).toFixed(
                0
              )}% | Age ${(normalizedAge * 90).toFixed(0)} days`}
              style={{
                backgroundColor: `hsl(${hue}, 90%, 50%)`,
                opacity,
                boxShadow: borderGlow,
                transition: "all 0.3s ease",
              }}
              className="rounded-sm aspect-square hover:scale-110 cursor-pointer"
            />
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>🟥 Weak / Fading</span>
        <span>🟩 Strong / Reinforced</span>
      </div>
    </div>
  );
};
