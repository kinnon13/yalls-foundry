/**
 * Settings Panel - Personalization
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sliders } from 'lucide-react';

export function SettingsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground mt-1">Personalize how Rocker behaves</p>
      </div>

      {/* Persona & Tone */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Persona & Tone
          </CardTitle>
          <CardDescription>Customize Rocker's communication style</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Response Style</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm mt-2">
              <option>Friendly & Conversational</option>
              <option>Concise & Professional</option>
              <option>Detailed & Informative</option>
            </select>
          </div>
          <div>
            <Label>Emoji Level</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm mt-2">
              <option>None</option>
              <option>Minimal</option>
              <option>Normal</option>
              <option>Lots</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
          <CardDescription>Set your default preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Preferred Mode</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm mt-2">
              <option>Voice</option>
              <option>Text</option>
              <option>Auto</option>
            </select>
          </div>
          <div>
            <Label>Timezone</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm mt-2">
              <option>America/New_York (EST)</option>
              <option>America/Chicago (CST)</option>
              <option>America/Denver (MST)</option>
              <option>America/Los_Angeles (PST)</option>
            </select>
          </div>
          <div>
            <Label>Units</Label>
            <select className="w-full border rounded-md px-3 py-2 text-sm mt-2">
              <option>Imperial (miles, lbs)</option>
              <option>Metric (km, kg)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what updates you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-summary" className="flex-1">
              Weekly learning summaries
            </Label>
            <Switch id="weekly-summary" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="unknowns-waiting" className="flex-1">
              Unknowns waiting for review
            </Label>
            <Switch id="unknowns-waiting" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="success-trends" className="flex-1">
              Success trends & insights
            </Label>
            <Switch id="success-trends" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
