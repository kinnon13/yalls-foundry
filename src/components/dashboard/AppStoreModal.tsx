import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppBubble } from './AppBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRocker } from '@/lib/ai/rocker';
import { toast } from 'sonner';
import {
  Building2, MessageSquare, Calendar,
  Award, BarChart3, Store, Search, Users, CreditCard, Palette, Sparkles
} from 'lucide-react';

const iconMap: Record<string, any> = {
  'Building2': Building2,
  'Sparkles': Sparkles, // For horse apps
  'MessageSquare': MessageSquare,
  'Calendar': Calendar,
  'Award': Award,
  'BarChart3': BarChart3,
  'Store': Store,
  'Search': Search,
  'Users': Users,
  'CreditCard': CreditCard,
  'Palette': Palette,
};

interface AppStoreModalProps {
  entityId?: string;
  onClose: () => void;
}

export function AppStoreModal({ entityId, onClose }: AppStoreModalProps) {
  const { log } = useRocker();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: apps, isLoading } = useQuery({
    queryKey: ['app-catalog', entityId, searchQuery],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('list_apps', {
        body: { 
          p_entity_id: entityId || null,
          p_q: searchQuery || null 
        }
      });
      return Array.isArray(data) ? data : [];
    }
  });

  const installMutation = useMutation({
    mutationFn: async (appKey: string) => {
      if (!entityId) throw new Error('No entity selected');
      
      const { error } = await supabase.rpc('install_app', {
        p_entity_id: entityId,
        p_app_key: appKey,
        p_config: {}
      });
      
      if (error) throw error;
    },
    onSuccess: (_, appKey) => {
      queryClient.invalidateQueries({ queryKey: ['installed-apps', entityId] });
      queryClient.invalidateQueries({ queryKey: ['app-catalog', entityId] });
      toast.success('App installed successfully');
      log('app_install_success', { app_key: appKey, entity_id: entityId });
    },
    onError: (error) => {
      toast.error('Failed to install app');
      log('app_install_error', { error: (error as Error).message });
    }
  });

  const getCategoryAccent = (category: string) => {
    const accents: Record<string, string> = {
      'Identity': 'hsl(258 85% 60%)',
      'Operations': 'hsl(200 90% 55%)',
      'Analytics': 'hsl(12 85% 60%)',
      'Commerce': 'hsl(160 65% 50%)',
      'Appearance': 'hsl(280 70% 60%)',
    };
    return accents[category] || 'hsl(258 85% 60%)';
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Y'all App Store</DialogTitle>
          <DialogDescription>
            Add apps and integrations to your workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {isLoading ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse h-32 bg-muted rounded-[22px]" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {apps && apps.map((app: any) => {
                const IconComponent = iconMap[app.icon] || Building2;
                
                return (
                  <div key={app.key} className="relative">
                    <AppBubble
                      icon={<IconComponent className="h-6 w-6" />}
                      title={app.name}
                      meta={app.summary}
                      accent={getCategoryAccent(app.category)}
                      onClick={() => {
                        if (!app.installed) {
                          installMutation.mutate(app.key);
                        }
                      }}
                    />
                    {app.installed && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary/10 text-xs font-medium">
                        Installed
                      </div>
                    )}
                    {app.pricing === 'pro' && !app.installed && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                        Pro
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {apps && apps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No apps found
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
