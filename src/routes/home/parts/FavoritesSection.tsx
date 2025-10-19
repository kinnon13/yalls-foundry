import { FavoritesBar } from '@/components/social/FavoritesBar';
import { useSession } from '@/lib/auth/context';

export default function FavoritesSection() {
  const { session } = useSession();
  const userId = session?.userId;

  if (!userId) return null;

  return (
    <div className="bg-background py-2 px-4 border-b overflow-visible">
      <div className="flex items-center gap-1 mb-2 px-1">
        <h2 className="text-xs font-semibold text-foreground">Favorites</h2>
      </div>
      
      <div className="py-1 px-1 overflow-visible">
        <FavoritesBar userId={userId} size={48} gap={8} />
      </div>
    </div>
  );
}
