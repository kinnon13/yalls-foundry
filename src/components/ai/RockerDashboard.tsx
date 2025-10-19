/**
 * Rocker AI Dashboard
 * Main interface for Rocker AI interactions
 */

import { RockerSuggestions } from './RockerSuggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RockerIcon } from './RockerIcon';
import { useProfile } from '@/contexts/ProfileContext';
import { Badge } from '@/components/ui/badge';

export function RockerDashboard() {
  const { activeProfile } = useProfile();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <RockerIcon className="w-12 h-12" />
            <div>
              <CardTitle className="text-2xl">Rocker AI Assistant</CardTitle>
              <CardDescription>
                Your intelligent business companion
              </CardDescription>
            </div>
          </div>
          {activeProfile && (
            <div className="mt-4">
              <Badge variant="secondary">
                Active Profile: {activeProfile.name}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm">Active & Learning</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Advanced</p>
                <p className="text-xs text-muted-foreground">Profile-aware AI</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Real-time</p>
                <p className="text-xs text-muted-foreground">Predictive insights</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <RockerSuggestions />
    </div>
  );
}
