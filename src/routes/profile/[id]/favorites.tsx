/**
 * User Favorites Tab
 * Displays all favorited items grouped by type
 */

import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Calendar, User, TrendingUp } from 'lucide-react';
import { useFavorite } from '@/hooks/useFavorite';

export default function ProfileFavoritesPage() {
  const { id } = useParams<{ id: string }>();
  const userId = id ?? 'me';

  const { data: allFavorites = [], isLoading } = useFavorite(userId);
  const postFavorites = allFavorites.filter(f => f.fav_type === 'post');
  const eventFavorites = allFavorites.filter(f => f.fav_type === 'event');
  const entityFavorites = allFavorites.filter(f => f.fav_type === 'entity');

  if (isLoading) {
    return (
      <div className="container py-8" role="status" aria-live="polite">
        <p className="text-muted-foreground">Loading favorites...</p>
      </div>
    );
  }

  if (allFavorites.length === 0) {
    return (
      <div className="container py-12 text-center">
        <Heart className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Favorites Yet</h2>
        <p className="text-muted-foreground">
          Favorite posts, events, and profiles to see them here.
        </p>
      </div>
    );
  }

  return (
    <section 
      role="region" 
      aria-label="Favorites" 
      className="container py-8"
    >
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="w-8 h-8" aria-hidden="true" />
          Favorites
        </h1>
        <p className="text-muted-foreground mt-1">
          {allFavorites.length} {allFavorites.length === 1 ? 'item' : 'items'}
        </p>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="all">
            All ({allFavorites.length})
          </TabsTrigger>
          <TabsTrigger value="posts">
            <TrendingUp className="w-4 h-4 mr-2" />
            Posts ({postFavorites.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="w-4 h-4 mr-2" />
            Events ({eventFavorites.length})
          </TabsTrigger>
          <TabsTrigger value="entities">
            <User className="w-4 h-4 mr-2" />
            Profiles ({entityFavorites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <FavoritesList favorites={allFavorites} />
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {postFavorites.length === 0 ? (
            <EmptyState type="posts" />
          ) : (
            <FavoritesList favorites={postFavorites} />
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {eventFavorites.length === 0 ? (
            <EmptyState type="events" />
          ) : (
            <FavoritesList favorites={eventFavorites} />
          )}
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          {entityFavorites.length === 0 ? (
            <EmptyState type="profiles" />
          ) : (
            <FavoritesList favorites={entityFavorites} />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

interface FavoritesListProps {
  favorites: Array<{ id: string; fav_type: string; ref_id: string; created_at: string }>;
}

function FavoritesList({ favorites }: FavoritesListProps) {
  return (
    <ul role="list" className="space-y-3">
      {favorites.map((fav) => (
        <li key={fav.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{fav.fav_type}</p>
              <p className="text-sm text-muted-foreground">ID: {fav.ref_id.slice(0, 8)}...</p>
            </div>
            <time className="text-sm text-muted-foreground">
              {new Date(fav.created_at).toLocaleDateString()}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No {type} favorited yet</p>
    </div>
  );
}
