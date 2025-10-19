import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Repeat2, UserPlus, UserMinus, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
  onViewProfile: (userId: string) => void;
}

// Mock user data
const mockUsers: Record<string, {
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  location: string;
  stats: { followers: number; following: number; posts: number };
  posts: Array<{ id: string; src: string; type: 'post' | 'repost' | 'tagged' }>;
  favoriteProfiles: Array<{ id: string; name: string; handle: string; avatar: string }>;
}> = {
  'nature1': {
    name: 'Nature Explorer',
    handle: 'natureexplorer',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'Capturing the beauty of the natural world 🌲🏔️',
    location: 'Colorado, USA',
    stats: { followers: 12500, following: 340, posts: 89 },
    posts: Array.from({ length: 24 }, (_, i) => ({
      id: `nature-${i}`,
      src: `https://picsum.photos/seed/nature-${i}/400/400`,
      type: i % 3 === 0 ? 'repost' : i % 5 === 0 ? 'tagged' : 'post'
    })),
    favoriteProfiles: [
      { id: 'fav1', name: 'Mountain Life', handle: 'mountainlife', avatar: 'https://i.pravatar.cc/150?img=11' },
      { id: 'fav2', name: 'Wildlife Photos', handle: 'wildlifepix', avatar: 'https://i.pravatar.cc/150?img=12' },
      { id: 'fav3', name: 'Trail Guide', handle: 'trailguide', avatar: 'https://i.pravatar.cc/150?img=13' },
      { id: 'fav4', name: 'Forest Tales', handle: 'foresttales', avatar: 'https://i.pravatar.cc/150?img=14' }
    ]
  },
  'city1': {
    name: 'City Vibes',
    handle: 'cityvibes',
    avatar: 'https://i.pravatar.cc/150?img=2',
    bio: 'Urban photography & street style 🏙️✨',
    location: 'New York, NY',
    stats: { followers: 8900, following: 567, posts: 156 },
    posts: Array.from({ length: 24 }, (_, i) => ({
      id: `city-${i}`,
      src: `https://picsum.photos/seed/city-${i}/400/400`,
      type: i % 4 === 0 ? 'repost' : i % 6 === 0 ? 'tagged' : 'post'
    })),
    favoriteProfiles: [
      { id: 'fav5', name: 'Street Art NYC', handle: 'streetartnyc', avatar: 'https://i.pravatar.cc/150?img=21' },
      { id: 'fav6', name: 'Urban Explorer', handle: 'urbanexp', avatar: 'https://i.pravatar.cc/150?img=22' },
      { id: 'fav7', name: 'Skyline Views', handle: 'skylineviews', avatar: 'https://i.pravatar.cc/150?img=23' },
      { id: 'fav8', name: 'Metro Stories', handle: 'metrostories', avatar: 'https://i.pravatar.cc/150?img=24' }
    ]
  }
};

export default function UserProfileView({ userId, onBack, onViewProfile }: UserProfileViewProps) {
  const user = mockUsers[userId];
  const { toast } = useToast();
  const { session } = useSession();
  const currentUserId = session?.userId;
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'tagged'>('posts');

  // Check if profile is favorited
  const { data: isFavorited = false } = useQuery({
    queryKey: ['is-favorited', currentUserId, userId],
    enabled: !!currentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from('user_pins')
        .select('id')
        .eq('user_id', currentUserId!)
        .eq('pin_type', 'entity')
        .eq('ref_id', userId)
        .eq('section', 'home')
        .maybeSingle();
      return !!data;
    }
  });

  // Toggle favorite mutation
  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Not signed in');
      
      // Prevent favoriting mock profiles with non-UUID IDs
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        throw new Error('Cannot favorite this profile');
      }
      
      if (isFavorited) {
        // Remove favorite
        await supabase
          .from('user_pins')
          .delete()
          .match({ user_id: currentUserId, pin_type: 'entity', ref_id: userId, section: 'home' });
      } else {
        // Add favorite
        const { data: existing } = await supabase
          .from('user_pins')
          .select('sort_index')
          .eq('user_id', currentUserId)
          .eq('pin_type', 'entity')
          .eq('section', 'home')
          .order('sort_index', { ascending: false })
          .limit(1);

        const nextIndex = (existing?.[0]?.sort_index ?? -1) + 1;
        
        await supabase
          .from('user_pins')
          .insert({
            user_id: currentUserId,
            pin_type: 'entity',
            ref_id: userId,
            section: 'home',
            sort_index: nextIndex,
            is_public: true,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-favorited', currentUserId, userId] });
      queryClient.invalidateQueries({ queryKey: ['favorite-bubbles', currentUserId] });
      toast({
        title: isFavorited ? 'Removed from favorites' : 'Added to favorites',
        description: isFavorited 
          ? `You removed ${user?.name} from your favorites`
          : `You added ${user?.name} to your favorites`
      });
    }
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-muted-foreground mb-4">User not found</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const handleFollow = () => {
    setFollowing(!following);
    toast({
      title: following ? 'Unfollowed' : 'Following!',
      description: `You ${following ? 'unfollowed' : 'are now following'} ${user.name}`
    });
  };

  const handleLike = () => {
    toast({ title: 'Liked!', description: `You liked ${user.name}'s profile` });
  };

  const handleRepost = () => {
    toast({ title: 'Reposted!', description: `You reposted ${user.name}'s latest post` });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const filteredPosts = user.posts.filter(post => {
    if (activeTab === 'posts') return post.type === 'post';
    if (activeTab === 'reposts') return post.type === 'repost';
    if (activeTab === 'tagged') return post.type === 'tagged';
    return true;
  });

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Profile Header */}
      <div className="px-4 py-4">
        {/* Profile Picture + Stats */}
        <div className="flex items-start gap-4 mb-4">
          <div 
            className="w-20 h-20 rounded-full p-[2.5px] flex-shrink-0"
            style={{
              background: 'linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7)',
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-background p-[2px]">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <h2 className="text-lg font-bold">{user.name}</h2>
            </div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-sm text-muted-foreground">@{user.handle}</span>
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 40 40" fill="currentColor">
                <path d="M19.998.002C8.952.002 0 8.954 0 19.998s8.952 19.996 19.998 19.996 19.998-8.952 19.998-19.996S31.044.002 19.998.002zm10.292 14.866l-11.764 11.764c-.292.292-.678.438-1.061.438-.383 0-.77-.146-1.061-.438l-5.884-5.882c-.586-.586-.586-1.535 0-2.121.586-.586 1.535-.586 2.121 0l4.823 4.823 10.703-10.703c.586-.586 1.535-.586 2.121 0 .588.585.588 1.534.002 2.119z"/>
              </svg>
            </div>

            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-semibold tabular-nums">{formatNumber(user.stats.posts)}</span>
                <span className="text-muted-foreground ml-1">posts</span>
              </div>
              <div>
                <span className="font-semibold tabular-nums">{formatNumber(user.stats.followers)}</span>
                <span className="text-muted-foreground ml-1">followers</span>
              </div>
              <div>
                <span className="font-semibold tabular-nums">{formatNumber(user.stats.following)}</span>
                <span className="text-muted-foreground ml-1">following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="text-sm space-y-1 mb-4">
          <p className="text-muted-foreground text-xs">{user.bio}</p>
          <p className="text-muted-foreground text-xs">{user.location}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleFollow}
            className="flex-1"
            variant={following ? 'outline' : 'default'}
          >
            {following ? (
              <>
                <UserMinus className="h-4 w-4 mr-2" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Follow
              </>
            )}
          </Button>
          <Button 
            onClick={() => toggleFavorite.mutate()} 
            variant={isFavorited ? 'default' : 'outline'} 
            size="icon"
            disabled={!currentUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)}
            title={!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) ? "Cannot favorite demo profiles" : ""}
          >
            <Star className={cn("h-4 w-4", isFavorited && "fill-current")} />
          </Button>
          <Button onClick={handleLike} variant="outline" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
          <Button onClick={handleRepost} variant="outline" size="icon">
            <Repeat2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Favorite Profiles */}
        {user.favoriteProfiles.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-1">FAVORITE PROFILES</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {user.favoriteProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => onViewProfile(profile.id)}
                  className="flex flex-col items-center gap-1 min-w-[70px] active:scale-95 transition-transform"
                >
                  <div 
                    className="w-16 h-16 rounded-[18px] overflow-hidden flex-shrink-0 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(249, 206, 52, 0.1), rgba(238, 42, 123, 0.1), rgba(98, 40, 215, 0.1))',
                    }}
                  >
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-center truncate w-full">{profile.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-t border-b sticky top-0 bg-background z-10">
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'posts'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab('reposts')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'reposts'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Reposts
        </button>
        <button
          onClick={() => setActiveTab('tagged')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'tagged'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Tagged
        </button>
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-3 gap-px bg-border p-px">
        {filteredPosts.map((post) => (
          <div key={post.id} className="relative aspect-square bg-background overflow-hidden">
            <img
              src={post.src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
