import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Row = {
  id: string;
  agent: string;
  action: string;
  result: string;
  created_at: string;
  input: any;
  output: any;
  correlation_id?: string;
};

export default function AIActivity() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('ai_action_my_timeline')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      setRows((data ?? []) as Row[]);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-4">What Rocker Did</h1>
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.id} className="border rounded p-3">
            <div className="text-sm text-gray-600">{new Date(r.created_at).toLocaleString()}</div>
            <div className="font-medium">{r.agent} → {r.action} <span className="text-xs">({r.result})</span></div>
            <pre className="bg-gray-50 rounded p-2 mt-2 text-xs overflow-auto">input: {JSON.stringify(r.input, null, 2)}</pre>
            <pre className="bg-gray-50 rounded p-2 mt-2 text-xs overflow-auto">output: {JSON.stringify(r.output, null, 2)}</pre>
            {r.correlation_id && <div className="text-xs text-gray-500 mt-1">corr: {r.correlation_id}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
