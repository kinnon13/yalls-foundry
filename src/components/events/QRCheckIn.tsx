import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/design/components/Button';
import { Input } from '@/design/components/Input';
import { useToast } from '@/hooks/use-toast';

export default function QRCheckIn() {
  const [code, setCode] = useState('');
  const { toast } = useToast();

  const checkIn = useMutation({
    mutationFn: async (qr: string) => {
      const { data, error } = await supabase.rpc('reservation_check_in', { p_qr: qr });
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: (ok) => {
      toast({ 
        title: ok ? 'Checked in ✅' : 'Not found or already processed', 
        variant: ok ? 'default' : 'destructive' 
      });
      setCode('');
    },
    onError: (e) => toast({ 
      title: 'Check-in failed', 
      description: (e as Error).message, 
      variant: 'destructive' 
    }),
  });

  return (
    <div className="flex w-full max-w-md items-center gap-2">
      <Input 
        value={code} 
        onChange={(val) => setCode(val)} 
        placeholder="Scan or paste QR code" 
      />
      <Button 
        variant="primary"
        size="m"
        onClick={() => checkIn.mutate(code)} 
        disabled={!code || checkIn.isPending}
      >
        {checkIn.isPending ? 'Checking…' : 'Check in'}
      </Button>
    </div>
  );
}
