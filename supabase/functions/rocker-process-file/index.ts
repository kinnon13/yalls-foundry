import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'rocker-process-file', RateLimits.expensive);
  if (limited) return limited;

  const log = createLogger('rocker-process-file');
  log.startTimer();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string;
    const userId = formData.get('userId') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info('Processing file', { fileName: file.name, fileType });

    // Upload to storage first
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rocker-files')
      .upload(fileName, file);

    if (uploadError) {
      log.error('Upload error', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('rocker-files')
      .getPublicUrl(fileName);

    let processedContent = '';

    // Process based on file type
    if (fileType === 'csv') {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      processedContent = `CSV file with ${lines.length - 1} rows and columns: ${headers.join(', ')}. First few rows:\n${lines.slice(0, 5).join('\n')}`;
    } 
    else if (fileType === 'pdf') {
      processedContent = `PDF file uploaded: ${file.name}. Size: ${(file.size / 1024).toFixed(2)} KB. You can view it at: ${publicUrl}`;
    }
    else if (fileType.startsWith('image/')) {
      processedContent = `Image uploaded: ${file.name}. Format: ${fileType}. Size: ${(file.size / 1024).toFixed(2)} KB. View at: ${publicUrl}`;
    }
    else {
      const text = await file.text();
      processedContent = text.substring(0, 1000) + (text.length > 1000 ? '...' : '');
    }

    return new Response(
      JSON.stringify({
        success: true,
        fileName: file.name,
        fileUrl: publicUrl,
        content: processedContent,
        type: fileType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.error('File processing error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
