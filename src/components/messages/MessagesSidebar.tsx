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
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">No conversation selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Profile */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={user?.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {user?.display_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{user?.display_name || 'Loading...'}</h3>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link to={`/profile/${conversationId}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </Button>

          <Button variant="outline" className="w-full justify-start">
            <UserPlus className="h-4 w-4 mr-2" />
            Add to Contacts
          </Button>

          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
            <Ban className="h-4 w-4 mr-2" />
            Block User
          </Button>

          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
            <Flag className="h-4 w-4 mr-2" />
            Report Conversation
          </Button>
        </div>

        <Separator />

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Messages are private and encrypted</p>
          <p>• Report abuse to keep the community safe</p>
          <p>• Blocked users cannot send you messages</p>
        </div>
      </CardContent>
    </Card>
  );
}
