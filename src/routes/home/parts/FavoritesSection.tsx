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
    <div className="h-full">
      <div className="flex items-center gap-1 mb-2">
        <Heart className="w-3 h-3 fill-red-500 text-red-500" />
        <h2 className="text-xs font-semibold">Favorites</h2>
      </div>
      
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-20rem)]">
        {favorites.map((fav) => (
          <button
            key={fav.id}
            className="w-full aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
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
