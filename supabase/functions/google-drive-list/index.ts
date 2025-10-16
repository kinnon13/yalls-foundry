import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'google-drive-list', RateLimits.standard);
  if (limited) return limited;

  const log = createLogger('google-drive-list');
  log.startTimer();

  try {
    const { accessToken, query } = await req.json();

    if (!accessToken) {
      throw new Error("Access token required");
    }

    // List files from Google Drive
    const searchQuery = query || "mimeType!='application/vnd.google-apps.folder'";
    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,mimeType,size,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!driveResponse.ok) {
      throw new Error("Failed to list Google Drive files");
    }

    const data = await driveResponse.json();

    return new Response(
      JSON.stringify({ files: data.files }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    log.error("Google Drive list error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
