import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { withRateLimit, getTenantFromJWT } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const log = createLogger('upload-media');
  log.startTimer();
  
  // Rate limiting for expensive function
  const limited = await withRateLimit(req, 'upload-media', { burst: 5, perMin: 30 });
  if (limited) return limited;
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const proxyFn = 'proxy-openai';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string || '';
    const visibility = formData.get('visibility') as string || 'private';
    const context = formData.get('context') as string || '';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = getTenantFromJWT(req) || user.id;
    
    // Determine file type
    const fileType = file.type.startsWith('image/') ? 'image' 
                   : file.type.startsWith('video/') ? 'video'
                   : 'document';

    log.info('Processing upload', { file_type: fileType, user_id: user.id, tenant_id: tenantId });

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      log.error('Upload failed', uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    log.info('File uploaded', { url: publicUrl });

    // Create media record
    const { data: mediaRecord, error: mediaError } = await supabase
      .from('media')
      .insert({
        user_id: user.id,
        file_url: publicUrl,
        file_type: fileType,
        file_name: file.name,
        file_size: file.size,
        caption: caption,
        visibility: visibility,
        metadata: { context }
      })
      .select()
      .single();

    if (mediaError) {
      log.error('Media record creation failed', mediaError);
      return new Response(JSON.stringify({ error: mediaError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log.info('Media record created', { media_id: mediaRecord.id });

    // If it's an image or video, analyze with AI
    let aiAnalysis = null;
    if (fileType === 'image' || fileType === 'video') {
      try {
        log.info('Starting AI analysis');
        
        // Use unified AI gateway for vision analysis
        const { ai } = await import("../_shared/ai.ts");
        
        const { text: content } = await ai.chat({
          role: 'knower',
          messages: [
            {
              role: 'system',
              content: `You are Rocker. Analyze uploaded media and extract: entities (horse/person/location/event), scene, emotion, context. Return pure JSON.`
            },
            {
              role: 'user',
              content: context ? `User context: ${context}. Analyze this ${fileType}.` : `Analyze this ${fileType}.`
            }
          ],
          maxTokens: 1000
        });

        if (content) {
          try {
            aiAnalysis = JSON.parse(content);
            log.info('AI analysis completed', { entities: aiAnalysis.entities?.length || 0 });

              // Update media record with AI analysis
              await supabase
                .from('media')
                .update({ ai_analysis: aiAnalysis })
                .eq('id', mediaRecord.id);

              // Auto-link detected entities
              if (aiAnalysis.entities && Array.isArray(aiAnalysis.entities)) {
                for (const entity of aiAnalysis.entities) {
                  if (entity.name && entity.confidence > 0.7) {
                    // Search for matching entities
                    const { data: matches } = await supabase.rpc('search_entities', {
                      p_query: entity.name,
                      p_tenant_id: tenantId,
                      p_limit: 1
                    });

                    if (matches && matches.length > 0) {
                      const match = matches[0];
                      log.info('Entity match found', { entity: match.name, type: match.entity_type });
                      
                      // Create entity link
                      await supabase
                        .from('media_entities')
                        .insert({
                          media_id: mediaRecord.id,
                          entity_type: match.entity_type === 'horse' ? 'horse' : 'profile',
                          entity_id: match.entity_id,
                          confidence: entity.confidence
                        });
                    }
                  }
                }
              }
          } catch (e) {
            log.error('Failed to parse AI analysis', e);
          }
        }
      } catch (aiError) {
        log.error('AI analysis error', aiError);
        // Don't fail the upload if AI analysis fails
      }
    }

    // Audit log
    await supabase.rpc('audit_write', {
      p_actor: user.id,
      p_role: 'user',
      p_tenant: tenantId,
      p_action: 'media.upload',
      p_scope: 'system',
      p_targets: [mediaRecord.id],
      p_meta: {
        file_type: fileType,
        file_name: file.name,
        has_ai_analysis: !!aiAnalysis
      }
    });

    return new Response(JSON.stringify({ 
      media: mediaRecord,
      ai_analysis: aiAnalysis,
      message: aiAnalysis 
        ? "Upload complete! I've analyzed the content and found some interesting details."
        : "Upload complete!"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log.error('Upload failed', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
