import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

type Consent = {
  user_id: string;
  proactive_enabled: boolean;
  channels: Record<string, boolean>;
  quiet_hours: [number, number] | null;
  frequency_cap: number;
};

export default function AISettings() {
  const { session } = useSession();
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    (async () => {
      if (!session?.userId) return;
      const { data } = await supabase
        .from('ai_consent')
        .select('*')
        .eq('user_id', session.userId)
        .maybeSingle();

      if (data) setConsent(data as Consent);
      else setConsent({
        user_id: session.userId,
        proactive_enabled: true,
        channels: { snackbar: true, dm: true, email: false, push: false },
        quiet_hours: null,
        frequency_cap: 5
      });
    })();
  }, [session?.userId]);

  const save = async () => {
    if (!consent) return;
    await supabase.from('ai_consent').upsert({
      user_id: consent.user_id,
      proactive_enabled: consent.proactive_enabled,
      channels: consent.channels,
      quiet_hours: consent.quiet_hours,
      frequency_cap: consent.frequency_cap
    });
  };

  if (!consent) return null;

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <h1 className="text-xl font-semibold">AI Settings</h1>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={consent.proactive_enabled}
          onChange={e => setConsent({ ...consent, proactive_enabled: e.target.checked })}
        />
        Allow proactive suggestions
      </label>

      <div>
        <h2 className="font-medium mb-2">Channels</h2>
        {['snackbar','dm','email','push'].map(ch => (
          <label key={ch} className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              checked={Boolean(consent.channels[ch])}
              onChange={e => setConsent({
                ...consent,
                channels: { ...consent.channels, [ch]: e.target.checked }
              })}
            />
            {ch}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className="block text-sm mb-1">Quiet hours (start)</label>
          <input
            type="number"
            min={0} max={23}
            value={consent.quiet_hours?.[0] ?? ''}
            onChange={e => {
              const start = e.target.value === '' ? null : Number(e.target.value);
              const end = consent.quiet_hours?.[1] ?? null;
              setConsent({
                ...consent,
                quiet_hours: start === null || end === null ? null : [start, end]
              });
            }}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Quiet hours (end)</label>
          <input
            type="number"
            min={1} max={24}
            value={consent.quiet_hours?.[1] ?? ''}
            onChange={e => {
              const end = e.target.value === '' ? null : Number(e.target.value);
              const start = consent.quiet_hours?.[0] ?? null;
              setConsent({
                ...consent,
                quiet_hours: start === null || end === null ? null : [start, end]
              });
            }}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Max suggestions per day</label>
        <input
          type="number"
          min={0} max={50}
          value={consent.frequency_cap}
          onChange={e => setConsent({ ...consent, frequency_cap: Number(e.target.value) })}
          className="border rounded px-2 py-1 w-40"
        />
      </div>

      <button onClick={save} className="mt-2 border px-3 py-2 rounded">
        Save
      </button>
    </div>
  );
}
