/**
 * Rocker AI Icon Component
 * Animated AI assistant icon with glow effect
 */

import { Brain, Sparkles } from 'lucide-react';

export function RockerIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-400 to-purple-500 rounded-full blur-md opacity-60 animate-pulse" />
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-full p-2">
        <Brain className="h-5 w-5 text-white" />
        <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
      </div>
    </div>
  );
}
