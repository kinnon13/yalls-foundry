/**
 * Feed Layout Settings Component
 * Allows users to customize their feed experience
 */

import { useFeedPreferences } from '@/hooks/useFeedPreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Info, Video, LayoutGrid, Rows3, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function FeedLayoutSettings() {
  const { preferences, loading, updateLayout, detectedLayout } = useFeedPreferences();

  if (loading) {
    return <div>Loading preferences...</div>;
  }

  const totalInteractions = 
    (preferences?.tiktok_interactions || 0) +
    (preferences?.instagram_interactions || 0) +
    (preferences?.facebook_interactions || 0);

  const tiktokPercent = totalInteractions > 0 
    ? ((preferences?.tiktok_interactions || 0) / totalInteractions) * 100 
    : 0;
  const instagramPercent = totalInteractions > 0 
    ? ((preferences?.instagram_interactions || 0) / totalInteractions) * 100 
    : 0;
  const facebookPercent = totalInteractions > 0 
    ? ((preferences?.facebook_interactions || 0) / totalInteractions) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feed Layout Preference</CardTitle>
          <CardDescription>
            Choose how you want to see posts in your feed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            value={preferences?.feed_layout || 'auto'} 
            onValueChange={(value) => updateLayout(value as any)}
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="auto" id="auto" />
              <Label htmlFor="auto" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Auto-detect</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Learn from my interactions and adapt automatically
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="tiktok" id="tiktok" />
              <Label htmlFor="tiktok" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span className="font-medium">TikTok Style</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full-screen vertical scrolling, one post at a time
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="instagram" id="instagram" />
              <Label htmlFor="instagram" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="font-medium">Instagram Style</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Photo grid layout with multiple posts visible
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="facebook" id="facebook" />
              <Label htmlFor="facebook" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Rows3 className="h-4 w-4" />
                  <span className="font-medium">Facebook Style</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Text-focused feed with detailed post cards
                </p>
              </Label>
            </div>
          </RadioGroup>

          {preferences?.feed_layout === 'auto' && totalInteractions > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">
                    Based on your interactions, you seem to prefer: <strong>{detectedLayout}</strong>
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>TikTok style</span>
                        <span>{tiktokPercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={tiktokPercent} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Instagram style</span>
                        <span>{instagramPercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={instagramPercent} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Facebook style</span>
                        <span>{facebookPercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={facebookPercent} />
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
