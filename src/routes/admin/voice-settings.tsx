import { VoiceSettings } from '@/components/rocker/VoiceSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';

export default function VoiceSettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Phone className="h-8 w-8" />
          Voice Communication
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure how Rocker can reach you via voice calls and messages
        </p>
      </div>

      <div className="space-y-6">
        <VoiceSettings />
        
        <Card>
          <CardHeader>
            <CardTitle>How Voice Communication Works</CardTitle>
            <CardDescription>
              Understanding Rocker's voice capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">📞 Voice Calls</h3>
              <p className="text-sm text-muted-foreground">
                Rocker can call you for urgent approvals or critical decisions. 
                Calls respect your quiet hours and will only occur when voice calls are enabled.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">🎙️ Voice Messages</h3>
              <p className="text-sm text-muted-foreground">
                Receive voice messages in the app with natural-sounding speech. 
                Perfect for longer updates or when you prefer audio.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">🔒 Privacy & Control</h3>
              <p className="text-sm text-muted-foreground">
                You have full control over when and how Rocker can reach you. 
                Set quiet hours, disable features, or adjust preferences anytime.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
