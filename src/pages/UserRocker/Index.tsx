/**
 * User Rocker - Personal Hub
 * User productivity workspace with voice controls
 */

import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VoiceControls } from './VoiceControls';

export default function UserRocker() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">User Rocker</h1>
        <p className="text-muted-foreground mb-4">
          Your personal productivity hub for goals, bookmarks, and preferences.
        </p>
        
        <VoiceControls />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Super Andy Chat</h3>
          <p className="text-muted-foreground mb-4">
            Open the AI assistant to get proactive suggestions and help.
          </p>
          <Button asChild>
            <Link to="/super-andy">Open Chat</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Preferences</h3>
          <p className="text-muted-foreground mb-4">
            Customize your AI experience: tone, format, approval mode, and more.
          </p>
          <Button asChild variant="outline">
            <Link to="/rocker/preferences">Edit Preferences</Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Recent Suggestions</h3>
          <p className="text-muted-foreground mb-4">
            View proactive suggestions from Super Andy.
          </p>
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">Goals & Bookmarks</h3>
          <p className="text-muted-foreground mb-4">
            Track your goals and saved items.
          </p>
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </Card>
      </div>
    </div>
  );
}
