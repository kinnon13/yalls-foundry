/**
 * Appearance Settings Sheet (<200 LOC)
 * Theme, density, accent, layout controls
 */

import { useState } from 'react';
import { useUserUIPrefs, type UIPrefs } from '@/lib/ui/useUIPrefs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Palette } from 'lucide-react';

export function AppearanceSheet() {
  const { prefs, savePrefs } = useUserUIPrefs();
  const [localPrefs, setLocalPrefs] = useState<UIPrefs>(prefs as UIPrefs);

  const handleSave = () => {
    savePrefs(localPrefs);
  };

  const themes: UIPrefs['theme'][] = ['light', 'dark', 'system'];
  const densities: UIPrefs['density'][] = ['compact', 'comfortable', 'spacious'];
  const accents = ['blue', 'purple', 'green', 'orange', 'red'];
  const headerStyles: UIPrefs['headerStyle'][] = ['default', 'minimal', 'bold'];
  const linkStyles: UIPrefs['linkStyle'][] = ['cards', 'list', 'grid'];
  const coverLayouts: UIPrefs['coverLayout'][] = ['banner', 'hero', 'minimal'];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="h-4 w-4 mr-2" />
          Appearance
        </Button>
      </SheetTrigger>

      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Appearance Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Theme */}
          <div>
            <Label className="mb-2 block">Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => (
                <Button
                  key={theme}
                  variant={localPrefs.theme === theme ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocalPrefs({ ...localPrefs, theme })}
                  className="capitalize"
                >
                  {theme}
                </Button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div>
            <Label className="mb-2 block">Density</Label>
            <div className="grid grid-cols-3 gap-2">
              {densities.map((density) => (
                <Button
                  key={density}
                  variant={localPrefs.density === density ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocalPrefs({ ...localPrefs, density })}
                  className="capitalize"
                >
                  {density}
                </Button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <Label className="mb-2 block">Accent Color</Label>
            <div className="flex gap-2">
              {accents.map((color) => (
                <button
                  key={color}
                  onClick={() => setLocalPrefs({ ...localPrefs, accentColor: color })}
                  className={`w-10 h-10 rounded-full bg-${color}-500 ${
                    localPrefs.accentColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Header Style */}
          <div>
            <Label className="mb-2 block">Header Style</Label>
            <div className="grid grid-cols-3 gap-2">
              {headerStyles.map((style) => (
                <Button
                  key={style}
                  variant={localPrefs.headerStyle === style ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocalPrefs({ ...localPrefs, headerStyle: style })}
                  className="capitalize"
                >
                  {style}
                </Button>
              ))}
            </div>
          </div>

          {/* Link Style */}
          <div>
            <Label className="mb-2 block">Link Style</Label>
            <div className="grid grid-cols-3 gap-2">
              {linkStyles.map((style) => (
                <Button
                  key={style}
                  variant={localPrefs.linkStyle === style ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocalPrefs({ ...localPrefs, linkStyle: style })}
                  className="capitalize"
                >
                  {style}
                </Button>
              ))}
            </div>
          </div>

          {/* Cover Layout */}
          <div>
            <Label className="mb-2 block">Cover Layout</Label>
            <div className="grid grid-cols-3 gap-2">
              {coverLayouts.map((layout) => (
                <Button
                  key={layout}
                  variant={localPrefs.coverLayout === layout ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocalPrefs({ ...localPrefs, coverLayout: layout })}
                  className="capitalize"
                >
                  {layout}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
