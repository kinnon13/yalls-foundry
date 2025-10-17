import { supabase } from "@/integrations/supabase/client";

export async function callEdge<T = any>(name: string, payload?: Record<string, any>) {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${accessToken}`,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `Edge ${name} failed`);
  return json as T;
}
