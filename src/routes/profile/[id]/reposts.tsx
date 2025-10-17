/**
 * User Reposts Tab
 * Displays all posts reposted by the user with attribution
 */

import { useParams } from 'react-router-dom';
import { Repeat2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Reposts } from '@/ports';

export default function ProfileRepostsPage() {
  const { id } = useParams<{ id: string }>();
  const userId = id ?? 'me';

  const { data: reposts = [], isLoading } = useQuery({
    queryKey: ['reposts', userId],
    queryFn: () => Reposts.list(userId),
  });

  if (isLoading) {
    return (
      <div className="container py-8" role="status" aria-live="polite">
        <p className="text-muted-foreground">Loading reposts...</p>
      </div>
    );
  }

  if (reposts.length === 0) {
    return (
      <div className="container py-12 text-center">
        <Repeat2 className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Reposts Yet</h2>
        <p className="text-muted-foreground">
          Share great content by reposting to your feed.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Repeat2 className="w-8 h-8" />
          Reposts
        </h1>
        <p className="text-muted-foreground mt-1">
          {reposts.length} {reposts.length === 1 ? 'repost' : 'reposts'}
        </p>
      </header>

      <ul role="list" className="space-y-4">
        {reposts.map((repost) => (
          <li
            key={repost.id}
            className="border rounded-lg p-6 hover:bg-accent transition-colors"
          >
            <div className="flex items-start gap-4">
              <Repeat2 className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="text-sm text-muted-foreground">
                  <p>
                    Reposted from{' '}
                    <span className="font-medium">Original Author</span>
                  </p>
                  <p>Source: {repost.source_post_id.slice(0, 8)}...</p>
                </div>
                <time className="text-xs text-muted-foreground block">
                  {new Date(repost.created_at).toLocaleString()}
                </time>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
