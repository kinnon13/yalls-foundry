import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, User, Building, Dog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EntityPreview {
  type: 'profile' | 'horse' | 'business';
  id: string;
  name: string;
  image?: string;
  description?: string;
  metadata?: any;
  previewUrl?: string;
}

interface EntityPreviewCardProps {
  entity: EntityPreview;
  onAction?: (action: string, entity: EntityPreview) => void;
}

export const EntityPreviewCard = ({ entity, onAction }: EntityPreviewCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getEntityIcon = () => {
    switch (entity.type) {
      case 'profile': return <User className="w-4 h-4" />;
      case 'horse': return <Dog className="w-4 h-4" />;
      case 'business': return <Building className="w-4 h-4" />;
    }
  };

  const getEntityColor = () => {
    switch (entity.type) {
      case 'profile': return 'bg-blue-500';
      case 'horse': return 'bg-green-500';
      case 'business': return 'bg-purple-500';
    }
  };

  const handleViewDetails = async () => {
    if (entity.previewUrl) {
      window.open(entity.previewUrl, '_blank');
    }
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      if (onAction) {
        await onAction(action, entity);
      }
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform action',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={entity.image} alt={entity.name} />
          <AvatarFallback className={getEntityColor()}>
            {entity.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="flex items-center gap-2">
            {entity.name}
            <Badge variant="secondary" className="flex items-center gap-1">
              {getEntityIcon()}
              {entity.type}
            </Badge>
          </CardTitle>
          {entity.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {entity.description}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {entity.metadata?.is_claimed === false && entity.type === 'horse' && (
          <Badge variant="outline" className="w-fit">
            Unclaimed
          </Badge>
        )}
        
        <div className="flex gap-2 mt-2">
          {entity.previewUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Details
            </Button>
          )}
          
          {entity.type === 'horse' && !entity.metadata?.is_claimed && (
            <Button
              size="sm"
              onClick={() => handleAction('claim')}
              disabled={loading}
            >
              Claim Horse
            </Button>
          )}
          
          {entity.type === 'profile' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAction('message')}
              disabled={loading}
            >
              Send Message
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
