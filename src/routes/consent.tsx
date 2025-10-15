import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConsent } from '@/hooks/useConsent';
import { toast } from 'sonner';

export default function ConsentPage() {
  const navigate = useNavigate();
  const { status, acceptConsent } = useConsent();
  const [loading, setLoading] = useState(false);
  
  const [agreed, setAgreed] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [pushOptIn, setPushOptIn] = useState(false);
  const [proactiveEnabled, setProactiveEnabled] = useState(false);

  const requiredVersion = status?.policy_version_required || 'v1';

  async function handleAccept() {
    if (!agreed) return;

    setLoading(true);
    try {
      await acceptConsent({
        policy_version: requiredVersion,
        sms_opt_in: smsOptIn,
        email_opt_in: emailOptIn,
        push_opt_in: pushOptIn,
        proactive_enabled: proactiveEnabled,
        scopes: proactiveEnabled ? ['nudge.events', 'auto.ocr'] : []
      });
      
      toast.success('Preferences saved');
      navigate('/');
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Privacy & Contact Preferences</CardTitle>
          <CardDescription>
            Set your preferences to continue using Y'alls.ai
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              We personalize your experience using your data as described in our Privacy Policy. 
              You can view, edit, export, or delete your data at any time in Settings.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30">
              <Checkbox
                id="required-consent"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="required-consent" className="font-semibold cursor-pointer">
                  I agree to the Terms & Privacy Policy (v{requiredVersion}) *
                </Label>
                <p className="text-sm text-muted-foreground">
                  Required to access the platform
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Optional Preferences</p>
              
              <div className="flex items-start space-x-3 p-3 border rounded">
                <Checkbox
                  id="proactive"
                  checked={proactiveEnabled}
                  onCheckedChange={(checked) => setProactiveEnabled(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="proactive" className="cursor-pointer">
                    Allow proactive AI suggestions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get smart recommendations and automated actions
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded">
                <Checkbox
                  id="sms"
                  checked={smsOptIn}
                  onCheckedChange={(checked) => setSmsOptIn(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="sms" className="cursor-pointer">
                    Allow SMS messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Text STOP to opt out. Message & data rates may apply.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded">
                <Checkbox
                  id="email"
                  checked={emailOptIn}
                  onCheckedChange={(checked) => setEmailOptIn(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="email" className="cursor-pointer">
                    Allow email updates
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications and updates via email
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded">
                <Checkbox
                  id="push"
                  checked={pushOptIn}
                  onCheckedChange={(checked) => setPushOptIn(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="push" className="cursor-pointer">
                    Allow push notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get browser notifications for important updates
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleAccept}
              disabled={!agreed || loading}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Agree & Continue'}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Access requires consent. You can change these settings anytime in Settings → Privacy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}