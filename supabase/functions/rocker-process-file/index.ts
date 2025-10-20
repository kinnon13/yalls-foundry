// supabase/functions/rocker-process-file/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BYTES = 25 * 1024 * 1024; // 25MB safety limit

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Per-function rate limit (uses your shared wrapper)
  const limited = await withRateLimit(req, "rocker-process-file", RateLimits.expensive);
  if (limited) return limited;

  const log = createLogger("rocker-process-file");
  const stop = log.startTimer();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = (formData.get("userId") as string | null) ?? undefined;
    // `type` is optional; prefer File.type when available
    const providedType = (formData.get("type") as string | null) ?? undefined;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Basic size guard (FormData/File already buffers in Edge runtime)
    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: `File too large (${Math.round(file.size / 1024)}KB). Max ${MAX_BYTES / 1024}KB.` }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileType = providedType ?? file.type ?? "application/octet-stream";
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    log.info("Uploading to storage", { fileName, fileType, size: file.size });

    // Upload first
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("rocker-files")
      .upload(fileName, file, { upsert: false });

    if (uploadError) {
      log.error("Upload error", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Public URL (assuming bucket is public; otherwise sign a URL)
    const { data: pub } = supabase.storage.from("rocker-files").getPublicUrl(fileName);
    const publicUrl = pub.publicUrl;

    // Lightweight "processing" summary; we avoid loading huge files into memory
    let processedContent = "";
    const lower = fileType.toLowerCase();

    // Text-ish quick read (guard length)
    const safeReadText = async (max = 200_000) => {
      const txt = await file.text();
      return txt.length > max ? txt.slice(0, max) : txt;
    };

    if (lower === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
      const text = await safeReadText(200_000); // ~200 KB
      const [firstLine, ...rest] = text.split(/\r?\n/);
      const headers = (firstLine ?? "").split(",");
      const preview = rest.slice(0, 4).join("\n");
      processedContent = `CSV: ${headers.length} column(s). ~${rest.length} row(s).\nColumns: ${headers.join(", ")}\n---\n${preview}`;
    } else if (lower.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
      // (Optional) If you have a separate PDF text extractor, call it here.
      processedContent = `PDF uploaded (${(file.size / 1024).toFixed(1)} KB). View: ${publicUrl}`;
    } else if (lower.startsWith("image/")) {
      // (Optional) Kick off OCR in a background job; here we just summarize
      processedContent = `Image uploaded (${fileType}, ${(file.size / 1024).toFixed(1)} KB). View: ${publicUrl}`;
    } else if (lower.startsWith("text/") || file.name.toLowerCase().endsWith(".txt") || file.name.toLowerCase().endsWith(".md")) {
      const text = await safeReadText();
      processedContent = (text.length > 1000 ? text.slice(0, 1000) + "..." : text);
    } else {
      // Binary or unknown
      processedContent = `File uploaded (${fileType}, ${(file.size / 1024).toFixed(1)} KB). View: ${publicUrl}`;
    }

    // Persist a DB record so the UI can discover & search this later
    // Adjust to your actual schema (rocker_files fields)
    const { data: record, error: recErr } = await supabase
      .from("rocker_files")
      .insert({
        user_id: userId,
        name: file.name,
        mime: fileType,
        size: file.size,
        storage_path: fileName,
        source: "upload",
        status: "inbox",
        summary: processedContent.slice(0, 240),
        text_content: lower.startsWith("text/") ? processedContent : null,
        public_url: publicUrl,
      })
      .select("id")
      .single();

    if (recErr) {
      log.error("DB insert error", recErr);
      // Don't fail the whole request; the file is in storage
    }

    stop(); // stop the timer

    return new Response(
      JSON.stringify({
        success: true,
        fileId: record?.id ?? null,
        fileName: file.name,
        fileUrl: publicUrl,
        content: processedContent,
        type: fileType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    stop();
    // Attempt to log—best effort
    try {
      log.error("File processing error", error);
    } catch { /* noop */ }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
