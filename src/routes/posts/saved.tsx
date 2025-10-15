import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostCard } from '@/components/posts/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SavedPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [collections, setCollections] = useState<string[]>(['All']);
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedPosts();
  }, [selectedCollection]);

  const fetchSavedPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's profile to check user_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!profileData) throw new Error('Profile not found');

      // Fetch saved posts with collection filter
      let query = supabase
        .from('post_saves')
        .select(`
          post_id,
          collection,
          note,
          created_at,
          posts (*)
        `)
        .eq('user_id', profileData.user_id)
        .order('created_at', { ascending: false });

      if (selectedCollection !== 'All') {
        query = query.eq('collection', selectedCollection);
      }

      const { data: savesData, error: savesError } = await query;

      if (savesError) throw savesError;

      if (savesData && savesData.length > 0) {
        // Extract posts and get unique collections
        const postsData = savesData.map(save => save.posts).filter(Boolean);
        setPosts(postsData);

        const uniqueCollections = ['All', ...new Set(savesData.map(s => s.collection).filter(Boolean))];
        setCollections(uniqueCollections);

        // Fetch author profiles
        const authorIds = [...new Set(postsData.map(p => p.author_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', authorIds);

        if (profilesData) {
          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as Record<string, any>);
          setProfiles(profilesMap);
        }
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('Error fetching saved posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load saved posts');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bookmark className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Saved Posts</h1>
              <p className="text-muted-foreground">Your bookmarked content</p>
            </div>
          </div>

          {/* Collection Filter */}
          {collections.length > 1 && (
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection} value={collection}>
                    {collection}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : posts.length === 0 ? (
        <Alert>
          <AlertDescription>
            No saved posts yet. Save posts from your feed to find them here!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4" data-testid="saved-posts-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={profiles[post.author_id]}
              onSaved={fetchSavedPosts}
              onReshared={fetchSavedPosts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
