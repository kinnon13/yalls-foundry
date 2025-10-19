import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function RockerButton() {
  const navigate = useNavigate();
  const ROCKER_ID = '00000000-0000-0000-0000-000000000001';

  return (
    <button
      onClick={() => navigate(`/entities/${ROCKER_ID}`)}
      className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-primary via-blue-500 to-cyan-400 shadow-2xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
      title="Open Rocker AI"
    >
      <Sparkles className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
    </button>
  );
}
