/**
 * AppearancePanel Component
 * Settings UI for wallpaper and screensaver
 */

import { useState } from 'react';
import { useAppearance } from '@/hooks/useAppearance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppearancePanelProps {
  subjectType: 'user' | 'entity';
  subjectId: string;
}

export function AppearancePanel({ subjectType, subjectId }: AppearancePanelProps) {
  const { data: settings, update } = useAppearance({ type: subjectType, id: subjectId });
  const [uploading, setUploading] = useState(false);

  const handleUploadWallpaper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${subjectType}-${subjectId}-${Date.now()}.${fileExt}`;
      const filePath = `wallpapers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('wallpapers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wallpapers')
        .getPublicUrl(filePath);

      await update.mutateAsync({
        wallpaper_url: publicUrl,
        screensaver_payload: (settings?.screensaver_payload || {}) as any,
      });

      toast.success('Wallpaper uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload wallpaper');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveWallpaper = async () => {
    await update.mutateAsync({
      wallpaper_url: null,
      screensaver_payload: (settings?.screensaver_payload || {}) as any,
    });
    toast.success('Wallpaper removed');
  };

  const handleUpdateScreensaver = async (updates: any) => {
    const currentScreensaver = (settings?.screensaver_payload as any) || {};
    await update.mutateAsync({
      wallpaper_url: settings?.wallpaper_url,
      screensaver_payload: {
        ...currentScreensaver,
        ...updates,
      },
    });
  };

  const screensaver = (settings?.screensaver_payload as any) || {};

  return (
    <div className="space-y-6">
      <Tabs defaultValue="wallpaper">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wallpaper">Wallpaper</TabsTrigger>
          <TabsTrigger value="screensaver">Screen Saver</TabsTrigger>
        </TabsList>

        <TabsContent value="wallpaper" className="space-y-4">
          {settings?.wallpaper_url ? (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={settings.wallpaper_url}
                  alt="Current wallpaper"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveWallpaper}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Wallpaper
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Input
                id="wallpaper-upload"
                type="file"
                accept="image/*"
                onChange={handleUploadWallpaper}
                disabled={uploading}
                className="hidden"
              />
              <Label
                htmlFor="wallpaper-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Click to upload wallpaper'}
                </span>
              </Label>
            </div>
          )}
        </TabsContent>

        <TabsContent value="screensaver" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="timeout">Idle timeout (seconds)</Label>
              <span className="text-sm text-muted-foreground">
                {screensaver.timeout ?? 45}s
              </span>
            </div>
            <Slider
              id="timeout"
              min={15}
              max={300}
              step={15}
              value={[screensaver.timeout ?? 45]}
              onValueChange={([value]) =>
                handleUpdateScreensaver({ timeout: value })
              }
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="blur">Blur effect</Label>
              <span className="text-sm text-muted-foreground">
                {screensaver.blur ?? 0}px
              </span>
            </div>
            <Slider
              id="blur"
              min={0}
              max={12}
              step={1}
              value={[screensaver.blur ?? 0]}
              onValueChange={([value]) =>
                handleUpdateScreensaver({ blur: value })
              }
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dim">Dim effect</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round((screensaver.dim ?? 0.3) * 100)}%
              </span>
            </div>
            <Slider
              id="dim"
              min={0}
              max={60}
              step={5}
              value={[Math.round((screensaver.dim ?? 0.3) * 100)]}
              onValueChange={([value]) =>
                handleUpdateScreensaver({ dim: value / 100 })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-clock">Show clock</Label>
            <Switch
              id="show-clock"
              checked={screensaver.showClock ?? false}
              onCheckedChange={(checked) =>
                handleUpdateScreensaver({ showClock: checked })
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
