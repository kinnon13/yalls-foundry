/**
 * Finder Modal - Mac-style global search + app links
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Home, ShoppingBag, Calendar, DollarSign, Settings, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FinderModalProps {
  open: boolean;
  onClose: () => void;
}

const APP_LINKS = [
  { section: 'social', icon: Home, label: 'Create Post', path: '/feed' },
  { section: 'social', icon: Home, label: 'My Profile', path: '/profile' },
  { section: 'social', icon: Home, label: 'Approvals', path: '/dashboard/approvals' },
  { section: 'marketplace', icon: ShoppingBag, label: 'Create Listing', path: '/listings/new' },
  { section: 'marketplace', icon: ShoppingBag, label: 'Browse Shop', path: '/discover' },
  { section: 'events', icon: Calendar, label: 'Create Event', path: '/events/new' },
  { section: 'events', icon: Calendar, label: 'View Calendar', path: '/dashboard?tab=calendar' },
  { section: 'earnings', icon: DollarSign, label: 'View Earnings', path: '/dashboard?tab=earnings' },
  { section: 'settings', icon: Settings, label: 'Settings', path: '/dashboard?tab=settings' },
];

export function FinderModal({ open, onClose }: FinderModalProps) {
  const [query, setQuery] = useState('');
  const [requestText, setRequestText] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: results = [] } = useQuery({
    queryKey: ['finder-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data: entities } = await supabase
        .from('entities')
        .select('id, display_name, handle, kind')
        .ilike('display_name', `%${query}%`)
        .limit(5);

      const { data: posts } = await supabase
        .from('posts')
        .select('id, body')
        .textSearch('body_tsv', query)
        .limit(5);

      const { data: listings } = await supabase
        .from('marketplace_listings')
        .select('id, title')
        .ilike('title', `%${query}%`)
        .limit(5);

      return [
        ...(entities || []).map((e: any) => ({ type: 'entity', ...e })),
        ...(posts || []).map((p: any) => ({ type: 'post', ...p })),
        ...(listings || []).map((l: any) => ({ type: 'listing', ...l })),
      ];
    },
    enabled: open && query.length >= 2,
  });

  const requestMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('capability_gaps')
        .insert({ user_id: user.id, text, section: 'general' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request submitted!');
      setRequestText('');
      queryClient.invalidateQueries({ queryKey: ['capability-gaps'] });
    },
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entities, posts, listings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Results</h3>
              {results.map((result: any) => (
                <Button
                  key={`${result.type}-${result.id}`}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    if (result.type === 'entity') handleNavigate(`/entities/${result.id}`);
                    if (result.type === 'listing') handleNavigate(`/listings/${result.id}`);
                    if (result.type === 'post') handleNavigate(`/feed?post=${result.id}`);
                  }}
                >
                  {result.display_name || result.title || result.body?.slice(0, 50)}
                </Button>
              ))}
            </div>
          )}

          {/* App Links */}
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {APP_LINKS.map((link) => (
                <Button
                  key={link.path}
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleNavigate(link.path)}
                >
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Request a thing */}
          <div className="space-y-2">
            <h3 className="font-semibold">Request a Feature</h3>
            <div className="flex gap-2">
              <Input
                placeholder="What would you like to see?"
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
              />
              <Button
                onClick={() => requestMutation.mutate(requestText)}
                disabled={!requestText || requestMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
