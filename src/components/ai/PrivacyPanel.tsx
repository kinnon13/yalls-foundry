/**
 * Privacy & Permissions Panel
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Download, Trash2 } from 'lucide-react';

export function PrivacyPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Privacy & Permissions</h2>
        <p className="text-muted-foreground mt-1">Control how Rocker uses your data</p>
      </div>

      {/* AI Context Access */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            AI Context Access
          </CardTitle>
          <CardDescription>Control what data Rocker can use in replies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="use-data" className="flex-1">
              Allow AI to use my data in replies
            </Label>
            <Switch id="use-data" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Max sensitivity allowed in chat context</Label>
              <p className="text-xs text-muted-foreground mt-1">Low sensitivity facts only</p>
            </div>
            <select className="border rounded-md px-3 py-2 text-sm">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Sharing Rules */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Sharing Rules</CardTitle>
          <CardDescription>Control how memories are shared</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="share-facts" className="flex-1">
              Share low-sensitivity facts with linked profiles
            </Label>
            <Switch id="share-facts" />
          </div>
        </CardContent>
      </Card>

      {/* Retention */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Retention</CardTitle>
          <CardDescription>How long to keep your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Keep chat transcripts for</Label>
              <p className="text-xs text-muted-foreground mt-1">Older chats will be auto-deleted</p>
            </div>
            <select className="border rounded-md px-3 py-2 text-sm">
              <option>Forever</option>
              <option>90 days</option>
              <option>30 days</option>
              <option>7 days</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Data Rights</CardTitle>
          <CardDescription>Export or delete your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" />
            Export my data (ZIP)
          </Button>
          <Button variant="destructive" className="w-full justify-start">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete all my data
          </Button>
          <p className="text-xs text-muted-foreground">
            Note: AI models don't train on your data; your information stays secure under these settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
