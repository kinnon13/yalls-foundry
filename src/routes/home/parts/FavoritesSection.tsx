import { Plus } from 'lucide-react';

export default function FavoritesSection() {
  // Mock favorites data with initials and ring colors
  const favorites = [
    { id: 1, initials: 'CM', ringColor: 'ring-purple-500' },
    { id: 2, initials: 'WR', ringColor: 'ring-cyan-500' },
    { id: 3, initials: 'SC', ringColor: 'ring-yellow-500' },
    { id: 4, initials: 'S', ringColor: 'ring-emerald-500' },
    { id: 5, initials: 'MV', ringColor: 'ring-blue-500' },
    { id: 6, initials: 'T', ringColor: 'ring-green-500' },
    { id: 7, initials: 'SJ', ringColor: 'ring-violet-500' },
  ];

  return (
    <div className="bg-background py-4 px-4 border-b overflow-visible">
      <div className="flex items-center gap-1 mb-3">
        <h2 className="text-sm font-semibold text-foreground">Favorites</h2>
      </div>
      
      <div className="flex gap-3 overflow-x-auto overflow-y-visible scrollbar-hide pb-1">
        {favorites.map((fav) => (
          <button
            key={fav.id}
            className="flex-shrink-0"
          >
            <div className={`w-16 h-16 rounded-full bg-muted flex items-center justify-center ring-2 ${fav.ringColor} hover:opacity-80 transition-opacity`}>
              <span className="text-sm font-semibold">{fav.initials}</span>
            </div>
          </button>
        ))}
        <button className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center hover:opacity-80 transition-opacity">
            <Plus className="w-6 h-6" />
          </div>
        </button>
      </div>
    </div>
  );
}
