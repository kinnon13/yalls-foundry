import { Heart } from 'lucide-react';

export default function FavoritesSection() {
  // Mock favorites data
  const favorites = [
    { id: 1, image: 'https://picsum.photos/seed/fav1/200/200', title: 'Favorite 1' },
    { id: 2, image: 'https://picsum.photos/seed/fav2/200/200', title: 'Favorite 2' },
    { id: 3, image: 'https://picsum.photos/seed/fav3/200/200', title: 'Favorite 3' },
    { id: 4, image: 'https://picsum.photos/seed/fav4/200/200', title: 'Favorite 4' },
    { id: 5, image: 'https://picsum.photos/seed/fav5/200/200', title: 'Favorite 5' },
    { id: 6, image: 'https://picsum.photos/seed/fav6/200/200', title: 'Favorite 6' },
  ];

  return (
    <div className="bg-background border-b py-3 px-4">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
        <h2 className="text-sm font-semibold">Favorites</h2>
      </div>
      
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {favorites.map((fav) => (
          <button
            key={fav.id}
            className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
          >
            <img
              src={fav.image}
              alt={fav.title}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
