/**
 * Phone Number Setup Component
 * Allows users to configure their phone for SMS notifications
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Smartphone, Check } from 'lucide-react';
import { toast } from 'sonner';

export function PhoneSetup() {
  const { session } = useSession();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const handleSave = async () => {
    if (!session?.userId) return;
    
    // Basic phone validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('voice_preferences')
        .upsert({
          user_id: session.userId,
          phone_number: `+1${cleanPhone}`, // Assuming US number, adjust as needed
        });

      if (error) throw error;

      setIsConfigured(true);
      toast.success('Phone number saved! You\'ll now receive SMS from Rocker.');
    } catch (error: any) {
      console.error('Error saving phone:', error);
      toast.error('Failed to save phone number');
    } finally {
      setIsLoading(false);
    }
  };

  if (isConfigured) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            <span className="font-medium">Phone configured! You'll receive SMS responses.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <CardTitle>Enable SMS Notifications</CardTitle>
        </div>
        <CardDescription>
          Add your phone number to receive text messages from Rocker
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            US numbers only. Format: 10 digits
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isLoading || !phone}
          className="w-full"
        >
          {isLoading ? 'Saving...' : 'Save Phone Number'}
        </Button>
      </CardContent>
    </Card>
  );
}
