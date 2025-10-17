/**
 * Messages Sidebar - Right panel with user profile & actions
 */

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Ban, Flag, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

type MessagesSidebarProps = {
  conversationId: string | null;
};

export function MessagesSidebar({ conversationId }: MessagesSidebarProps) {
  const session = useSession();

  const { data: user } = useQuery({
    queryKey: ['user-profile-sidebar', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .eq('user_id', conversationId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  if (!conversationId) {
    return (
      <Card className="h-full border-0 shadow-xl backdrop-blur-sm bg-card/80">
        <CardContent className="flex items-center justify-center h-full animate-fade-in">
          <div className="text-center">
            <div className="mb-4 w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No conversation selected</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Choose a conversation to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-0 shadow-xl backdrop-blur-sm bg-card/80">
      <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-transparent">
        <CardTitle className="text-xl">Profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* User Profile */}
        <div className="flex flex-col items-center text-center animate-fade-in">
          <div className="relative mb-4 group">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg transition-transform group-hover:scale-105">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                {user?.display_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
          </div>
          <h3 className="font-bold text-xl mb-1">{user?.display_name || 'Loading...'}</h3>
          <p className="text-sm text-muted-foreground">Active recently</p>
        </div>

        <Separator className="bg-border/50" />

        {/* Actions */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Button 
            variant="outline" 
            className="w-full justify-start hover:bg-primary/5 hover:border-primary/20 transition-all shadow-sm hover:shadow-md group" 
            asChild
          >
            <Link to={`/profile/${conversationId}`}>
              <ExternalLink className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
              View Profile
            </Link>
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start hover:bg-primary/5 hover:border-primary/20 transition-all shadow-sm hover:shadow-md group"
          >
            <UserPlus className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
            Add to Contacts
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20 transition-all shadow-sm hover:shadow-md group"
          >
            <Ban className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
            Block User
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20 transition-all shadow-sm hover:shadow-md group"
          >
            <Flag className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
            Report Conversation
          </Button>
        </div>

        <Separator className="bg-border/50" />

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-2 p-4 bg-muted/30 rounded-lg border border-border/50 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <p>Messages are private and encrypted</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <p>Report abuse to keep the community safe</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <p>Blocked users cannot send you messages</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
