/**
 * Feature Flags Control Panel
 * 
 * Admin UI to enable/disable local feature flags.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAllFeatureFlags } from '@/hooks/useFeatureFlags';
import { setFlag, type FlagKey } from '@/lib/flags/index';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  Calendar, 
  ShoppingCart,
  Search,
  MessageSquare,
  BarChart3
} from 'lucide-react';

const flagMetadata: Record<FlagKey, { name: string; description: string; icon: any; category: string }> = {
  feedback: {
    name: 'Feedback Widget',
    description: 'Show feedback widget for user input',
    icon: MessageSquare,
    category: 'platform'
  },
  ai: {
    name: 'Rocker AI',
    description: 'Enable AI assistant features',
    icon: Mic,
    category: 'ai'
  },
  events: {
    name: 'Events UI',
    description: 'Enable events management interface',
    icon: Calendar,
    category: 'events'
  },
  market: {
    name: 'Marketplace',
    description: 'Enable marketplace features',
    icon: ShoppingCart,
    category: 'commerce'
  },
  new_search: {
    name: 'New Search',
    description: 'Experimental search interface',
    icon: Search,
    category: 'discovery'
  },
  feed: {
    name: 'Feed UI',
    description: 'Social feed interface',
    icon: MessageSquare,
    category: 'discovery'
  },
  composer_coach: {
    name: 'Composer Coach',
    description: 'Live writing assistance',
    icon: Mic,
    category: 'ai'
  },
  ai_rank: {
    name: 'AI Ranking',
    description: 'AI-powered content ranking',
    icon: BarChart3,
    category: 'ai'
  }
};

const categoryColors: Record<string, string> = {
  platform: 'bg-blue-500/10 text-blue-500',
  ai: 'bg-purple-500/10 text-purple-500',
  events: 'bg-green-500/10 text-green-500',
  commerce: 'bg-emerald-500/10 text-emerald-500',
  discovery: 'bg-orange-500/10 text-orange-500',
};

export function FeatureFlagsPanel() {
  const flags = useAllFeatureFlags();
  const { toast } = useToast();

  const toggleFlag = (key: FlagKey) => {
    const newValue = !flags[key];
    setFlag(key, newValue);
    
    toast({
      title: newValue ? 'Feature Enabled' : 'Feature Disabled',
      description: `${flagMetadata[key].name} ${newValue ? 'enabled' : 'disabled'}`,
    });
  };

  const groupedFlags = Object.entries(flags).reduce((acc, [key, enabled]) => {
    const meta = flagMetadata[key as FlagKey];
    if (!meta) return acc;
    
    if (!acc[meta.category]) {
      acc[meta.category] = [];
    }
    acc[meta.category].push({ key: key as FlagKey, enabled, ...meta });
    return acc;
  }, {} as Record<string, Array<{ key: FlagKey; enabled: boolean; name: string; description: string; icon: any; category: string }>>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable platform features. Changes apply instantly.
              </CardDescription>
            </div>
            <Badge variant="outline">
              {Object.values(flags).filter(Boolean).length} / {Object.keys(flags).length} enabled
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {Object.entries(groupedFlags).map(([category, categoryFlags]) => {
        const colorClass = categoryColors[category] || 'bg-gray-500/10 text-gray-500';
        const IconComponent = categoryFlags[0]?.icon || MessageSquare;
        
        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg capitalize">{category}</CardTitle>
                  <CardDescription>
                    {categoryFlags.length} feature{categoryFlags.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryFlags.map((flag) => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold">{flag.name}</h4>
                      {flag.enabled ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {flag.description}
                    </p>
                  </div>
                  
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => toggleFlag(flag.key)}
                    className="ml-4"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
