/**
 * Process Mail Outbox Edge Function
 * Processes pending emails from mail_outbox table
 * 
 * Triggered by:
 * - Cron job (daily/weekly for digests)
 * - Manual invocation for test emails
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MailOutboxRecord {
  id: string;
  user_id: string;
  template: string;
  payload: Record<string, any>;
  created_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[MailOutbox] Starting batch processing...');

    // Fetch unsent emails (limit to prevent timeouts)
    const { data: outbox, error: fetchError } = await supabaseClient
      .from('mail_outbox')
      .select('*')
      .is('sent_at', null)
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('[MailOutbox] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!outbox || outbox.length === 0) {
      console.log('[MailOutbox] No pending emails');
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending emails' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[MailOutbox] Found ${outbox.length} pending emails`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each email
    for (const record of outbox as MailOutboxRecord[]) {
      try {
        console.log(`[MailOutbox] Processing ${record.id}, template: ${record.template}`);

        // Get user email from auth
        const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(
          record.user_id
        );

        if (userError || !userData?.user?.email) {
          throw new Error(`User not found or no email: ${record.user_id}`);
        }

        const userEmail = userData.user.email;

        // Template-specific email content
        let subject = '';
        let htmlBody = '';

        if (record.template === 'notification_digest_test') {
          subject = 'Your Notification Digest (Test)';
          htmlBody = formatDigestEmail(record.payload, userEmail);
        } else {
          throw new Error(`Unknown template: ${record.template}`);
        }

        // TODO: Replace with your email provider (Resend, SendGrid, etc.)
        // For now, just log what would be sent
        console.log(`[MailOutbox] Would send email:`, {
          to: userEmail,
          subject,
          template: record.template,
          digestItems: record.payload.digest?.length || 0
        });

        // Mark as sent using RPC
        const { error: rpcError } = await supabaseClient.rpc('notification_digest_mark_sent', {
          p_outbox_id: record.id
        });

        if (rpcError) {
          console.error(`[MailOutbox] RPC error for ${record.id}:`, rpcError);
          throw rpcError;
        }

        results.processed++;
        results.succeeded++;
      } catch (error) {
        console.error(`[MailOutbox] Error processing ${record.id}:`, error);
        results.processed++;
        results.failed++;
        results.errors.push(`${record.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log('[MailOutbox] Batch complete:', results);

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );
  } catch (error) {
    console.error('[MailOutbox] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});

/**
 * Format digest email HTML
 */
function formatDigestEmail(payload: Record<string, any>, userEmail: string): string {
  const digest = payload.digest || [];
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Notification Digest</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
        .lane { margin: 20px 0; padding: 15px; border-radius: 8px; }
        .lane-priority { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .lane-social { background: #dbeafe; border-left: 4px solid #3b82f6; }
        .lane-system { background: #f3f4f6; border-left: 4px solid #6b7280; }
        .lane h2 { margin: 0 0 10px 0; font-size: 18px; }
        .notif { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .notif-title { font-weight: 600; margin-bottom: 5px; }
        .notif-body { font-size: 14px; color: #666; }
        .notif-time { font-size: 12px; color: #999; margin-top: 5px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <h1>📬 Your Notification Digest</h1>
      <p>Hi ${userEmail},</p>
      <p>Here's a summary of your unread notifications:</p>
  `;

  for (const group of digest) {
    const laneClass = `lane-${group.lane}`;
    const laneTitle = group.lane.charAt(0).toUpperCase() + group.lane.slice(1);
    const items = group.items || [];

    html += `
      <div class="lane ${laneClass}">
        <h2>${laneTitle} (${items.length})</h2>
    `;

    for (const item of items) {
      html += `
        <div class="notif">
          <div class="notif-title">${item.title}</div>
          ${item.body ? `<div class="notif-body">${item.body}</div>` : ''}
          ${item.link ? `<div><a href="${item.link}">View →</a></div>` : ''}
          <div class="notif-time">${new Date(item.created_at).toLocaleString()}</div>
        </div>
      `;
    }

    html += `</div>`;
  }

  html += `
      <div class="footer">
        <p>This is a test digest email. To manage your notification preferences, visit Settings → Notifications.</p>
        <p>© ${new Date().getFullYear()} Yalls.ai. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return html;
}
