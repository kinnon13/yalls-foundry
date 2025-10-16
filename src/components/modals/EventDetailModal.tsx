/**
 * Event Detail Modal
 * 
 * Deep-linkable event detail view via ?eventId=<uuid>
 * Features: calendar add/remove, follow host, share, AI plan
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Share2, MessageCircle, Sparkles, Plus, Check, UserPlus, UserMinus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

type EventDetail = {
  id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location?: any;
  host_profile_id: string;
  host_name: string;
  host_avatar: string;
  created_at: string;
};

export function EventDetailModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const eventId = searchParams.get('eventId');
  const from = searchParams.get('from');
  const isOpen = !!eventId;

  const handleClose = () => {
    searchParams.delete('eventId');
    searchParams.delete('from');
    setSearchParams(searchParams, { replace: true });
    document.body.focus();
  };

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch event with visibility check
  const { data: event, error, isLoading } = useQuery<EventDetail | null>({
    queryKey: ['event-detail', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .rpc('get_event_viewable', { p_event_id: eventId } as any);

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!eventId
  });

  // Check if in calendar
  const { data: inCalendar } = useQuery({
    queryKey: ['calendar-check', session?.userId, eventId],
    queryFn: async () => {
      if (!session?.userId || !eventId) return false;
      
      // @ts-expect-error - types pending
      const { data } = await supabase
        .from('calendar_events')
        .select('event_id', { count: 'exact', head: true })
        .eq('user_id', session.userId)
        .eq('event_id', eventId);
      
      return !!data;
    },
    enabled: !!(session?.userId && eventId)
  });

  // Check if following host
  const { data: isFollowing } = useQuery({
    queryKey: ['follow-check', session?.userId, event?.host_profile_id],
    queryFn: async () => {
      if (!session?.userId || !event?.host_profile_id) return false;
      
      const { data } = await supabase
        .from('follows' as any)
        .select('id')
        .eq('follower_id', session.userId)
        .eq('followed_id', event.host_profile_id)
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!(session?.userId && event?.host_profile_id)
  });

  // Calendar mutations
  const addToCalendar = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error('No event ID');
      // @ts-expect-error - RPC not yet in types
      const { error } = await supabase.rpc('calendar_add_event', {
        p_event_id: eventId,
        p_source: 'event_modal'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-check'] });
      toast({ title: "Added to calendar" });
    },
    onError: (error) => {
      console.error('Error adding to calendar:', error);
      toast({ title: "Error", description: "Failed to add to calendar", variant: "destructive" });
    }
  });

  const removeFromCalendar = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error('No event ID');
      // @ts-expect-error - RPC not yet in types
      const { error } = await supabase.rpc('calendar_remove_event', {
        p_event_id: eventId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-check'] });
      toast({ title: "Removed from calendar" });
    }
  });

  // Follow mutations
  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!session?.userId || !event?.host_profile_id) throw new Error('Missing data');
      
      if (isFollowing) {
        const { error } = await supabase
          .from('follows' as any)
          .delete()
          .eq('follower_id', session.userId)
          .eq('followed_id', event.host_profile_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows' as any)
          .insert({
            follower_id: session.userId,
            followed_id: event.host_profile_id
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-check'] });
      queryClient.invalidateQueries({ queryKey: ['event-detail'] });
      toast({ title: isFollowing ? "Unfollowed" : "Following" });
    }
  });

  // Share handler
  const handleShare = () => {
    const url = `${window.location.origin}/?eventId=${eventId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'a' && session?.userId) {
        e.preventDefault();
        if (inCalendar) removeFromCalendar.mutate();
        else addToCalendar.mutate();
      } else if (e.key === 'f' && session?.userId && event) {
        e.preventDefault();
        toggleFollow.mutate();
      } else if (e.key === 's') {
        e.preventDefault();
        handleShare();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, session, inCalendar, event, isFollowing]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <LoadingSkeleton />
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !event) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Event Not Found</h2>
            <p className="text-muted-foreground text-center">
              This event isn't available or you don't have permission to view it.
              {!session && " Try signing in to view follower-only events."}
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isOwn = session?.userId === event.host_profile_id;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-2xl">{event.title}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">
                  {format(new Date(event.start_at), 'MMM d, h:mm a')}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Host */}
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={event.host_avatar} />
              <AvatarFallback>{event.host_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{event.host_name}</p>
              <p className="text-sm text-muted-foreground">Host</p>
            </div>
            {session?.userId && !isOwn && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={() => toggleFollow.mutate()}
                disabled={toggleFollow.isPending}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="space-y-2">
              <h3 className="font-semibold">About</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Time & Location */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {format(new Date(event.start_at), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.start_at), 'h:mm a')} - {format(new Date(event.end_at), 'h:mm a')}
                </p>
              </div>
            </div>

            {event.location?.name && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{event.location.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {session?.userId && (
              <Button
                variant={inCalendar ? "secondary" : "default"}
                onClick={() => {
                  if (inCalendar) removeFromCalendar.mutate();
                  else addToCalendar.mutate();
                }}
                disabled={addToCalendar.isPending || removeFromCalendar.isPending}
              >
                {inCalendar ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    In Calendar
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Calendar
                  </>
                )}
              </Button>
            )}
            
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            {session?.userId && !isOwn && (
              <Button variant="outline">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Host
              </Button>
            )}
          </div>

          {/* Keyboard hints */}
          {session?.userId && (
            <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
              <p>Keyboard shortcuts:</p>
              <div className="flex gap-4">
                <span><kbd className="px-1.5 py-0.5 bg-muted rounded">A</kbd> Add/Remove Calendar</span>
                {!isOwn && <span><kbd className="px-1.5 py-0.5 bg-muted rounded">F</kbd> Follow/Unfollow</span>}
                <span><kbd className="px-1.5 py-0.5 bg-muted rounded">S</kbd> Share</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
