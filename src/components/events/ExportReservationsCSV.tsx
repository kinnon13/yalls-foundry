import { Button } from '@/design/components/Button';
import { supabase } from '@/integrations/supabase/client';

export default function ExportReservationsCSV({ eventId }: { eventId: string }) {
  const onExport = async () => {
    const { data, error } = await supabase.rpc('reservations_export_csv', { p_event_id: eventId });
    if (error) throw error;

    const csv = 'id,user_id,kind,qty,amount_cents,status,qr_code,created_at\n' +
      (data as string).split('\n').map((jsonLine) => {
        try {
          const row = JSON.parse(jsonLine);
          return [row.id, row.user_id, row.kind, row.qty, row.amount_cents, row.status, row.qr_code, row.created_at].join(',');
        } catch { return ''; }
      }).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `reservations-${eventId}.csv`; 
    a.click();
  };

  return (
    <Button variant="ghost" size="m" onClick={onExport}>
      Export CSV
    </Button>
  );
}
