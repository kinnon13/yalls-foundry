/**
 * Email Inbound Handler
 * 
 * Receives emails from SendGrid Inbound Parse webhook.
 * Parses and stores in emails_inbound table for Rocker processing.
 * 
 * SendGrid Setup:
 * 1. Configure Inbound Parse for your domain (e.g., in.yourdomain.com)
 * 2. Point to: https://<project>.functions.supabase.co/email-inbound
 * 3. Enable "POST raw" option
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  headers: Record<string, string>;
  attachments: Array<{
    filename: string;
    type: string;
    content_id?: string;
  }>;
}

async function parseMultipartForm(req: Request): Promise<ParsedEmail> {
  const formData = await req.formData();
  
  const email: ParsedEmail = {
    from: formData.get('from') as string || '',
    to: formData.get('to') as string || '',
    subject: formData.get('subject') as string || '',
    text: formData.get('text') as string || '',
    html: formData.get('html') as string || '',
    headers: {},
    attachments: []
  };

  // Parse headers
  const headersStr = formData.get('headers') as string;
  if (headersStr) {
    try {
      email.headers = JSON.parse(headersStr);
    } catch {
      console.warn('Failed to parse headers');
    }
  }

  // Parse attachments info (files are separate)
  const attachmentInfo = formData.get('attachment-info') as string;
  if (attachmentInfo) {
    try {
      email.attachments = JSON.parse(attachmentInfo);
    } catch {
      console.warn('Failed to parse attachment info');
    }
  }

  return email;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[Email Inbound] Receiving email from SendGrid');

    // Parse the multipart form data
    const email = await parseMultipartForm(req);

    console.log('[Email Inbound] From:', email.from, 'To:', email.to, 'Subject:', email.subject);

    // Store in database
    const { data, error } = await supabase
      .from('emails_inbound')
      .insert({
        msg_id: email.headers['message-id'] || crypto.randomUUID(),
        from_addr: email.from,
        to_addr: email.to,
        subject: email.subject,
        text_body: email.text,
        html_body: email.html,
        headers: email.headers,
        attachments: email.attachments,
        processed: false
      })
      .select()
      .single();

    if (error) {
      console.error('[Email Inbound] DB error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Email Inbound] Stored email:', data.id);

    // Trigger async processing (fire and forget)
    // In production, you'd queue this or use a separate cron job
    fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/process-inbound-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({ email_id: data.id })
    }).catch(err => console.error('[Email Inbound] Failed to trigger processor:', err));

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Email Inbound] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
