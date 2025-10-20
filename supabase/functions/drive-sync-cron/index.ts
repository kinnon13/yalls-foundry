/**
 * Drive Sync Cron - Google Drive Periodic Sync
 * Pulls new/changed files from connected folders hourly
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if drive sync is enabled
    const { data: flag } = await supabase
      .from("runtime_flags")
      .select("value")
      .eq("key", "drive.sync")
      .maybeSingle();

    if (!flag?.value?.enabled) {
      return new Response(
        JSON.stringify({ ok: true, message: "Drive sync disabled" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Get users with OAuth tokens
    const { data: tokens } = await supabase
      .from("user_oauth_tokens")
      .select("user_id, access_token, refresh_token, expires_at")
      .eq("provider", "google");

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "No users with Drive connected" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const results: any[] = [];

    for (const token of tokens) {
      try {
        // Refresh token if expired
        let accessToken = token.access_token;
        if (token.expires_at && new Date(token.expires_at) < new Date()) {
          const refreshResp = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
              client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
              refresh_token: token.refresh_token!,
              grant_type: "refresh_token",
            }),
          });

          if (!refreshResp.ok) {
            throw new Error("Token refresh failed");
          }

          const refreshData = await refreshResp.json();
          accessToken = refreshData.access_token;

          // Update token
          await supabase
            .from("user_oauth_tokens")
            .update({
              access_token: accessToken,
              expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
            })
            .eq("user_id", token.user_id);
        }

        // Get sync state
        const { data: syncState } = await supabase
          .from("drive_sync_state")
          .select("*")
          .eq("user_id", token.user_id)
          .maybeSingle();

        const folders = syncState?.folders || [];
        let filesProcessed = 0;

        for (const folder of folders) {
          // List files in folder (changed since last sync)
          const query = syncState?.last_sync_at
            ? `'${folder.id}' in parents and modifiedTime > '${syncState.last_sync_at}'`
            : `'${folder.id}' in parents`;

          const listResp = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size)`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!listResp.ok) continue;

          const listData = await listResp.json();
          const files = listData.files || [];

          for (const file of files) {
            // Download file content (for text files)
            if (
              file.mimeType === "application/vnd.google-apps.document" ||
              file.mimeType === "text/plain" ||
              file.mimeType === "application/pdf"
            ) {
              // For Google Docs, export as plain text
              const exportUrl =
                file.mimeType === "application/vnd.google-apps.document"
                  ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`
                  : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;

              const contentResp = await fetch(exportUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });

              if (contentResp.ok) {
                const textContent = await contentResp.text();

                // Upsert into rocker_files
                const { data: existingFile } = await supabase
                  .from("rocker_files")
                  .select("id")
                  .eq("user_id", token.user_id)
                  .eq("source", "drive")
                  .eq("storage_path", file.id)
                  .maybeSingle();

                if (existingFile) {
                  await supabase
                    .from("rocker_files")
                    .update({
                      title: file.name,
                      text_content: textContent,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", existingFile.id);
                } else {
                  await supabase.from("rocker_files").insert({
                    user_id: token.user_id,
                    title: file.name,
                    text_content: textContent,
                    source: "drive",
                    storage_path: file.id,
                    folder_path: folder.name,
                    status: "inbox",
                  });
                }

                filesProcessed++;
              }
            }
          }
        }

        // Update sync state
        await supabase
          .from("drive_sync_state")
          .upsert({
            user_id: token.user_id,
            last_sync_at: new Date().toISOString(),
            error: null,
          });

        results.push({ user_id: token.user_id, files: filesProcessed });
      } catch (error: any) {
        console.error(`Sync error for ${token.user_id}:`, error);
        await supabase
          .from("drive_sync_state")
          .upsert({
            user_id: token.user_id,
            error: error.message,
          });
        results.push({ user_id: token.user_id, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, results }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("drive-sync-cron error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
