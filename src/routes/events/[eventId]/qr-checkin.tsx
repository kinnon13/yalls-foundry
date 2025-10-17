/**
 * QR Check-In Scanner Page
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function QRCheckinPage() {
  const { eventId } = useParams();
  const [entryId, setEntryId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckin = async () => {
    if (!entryId.trim()) {
      toast.error('Please enter an entry ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qr-checkin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ entry_id: entryId }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Check-in failed');
      }

      toast.success(result.message || 'Checked in successfully!');
      setEntryId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>QR Check-In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="entry-id">Entry ID</Label>
              <Input
                id="entry-id"
                value={entryId}
                onChange={(e) => setEntryId(e.target.value)}
                placeholder="Scan QR code or enter UUID"
                className="font-mono"
              />
            </div>

            <Button 
              onClick={handleCheckin} 
              disabled={loading || !entryId.trim()}
              className="w-full"
            >
              {loading ? 'Checking in...' : 'Check In'}
            </Button>

            <div className="text-sm text-muted-foreground text-center mt-4">
              <p>Scan the entry QR code or manually enter the entry ID</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
