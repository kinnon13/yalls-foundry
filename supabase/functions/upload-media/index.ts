import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
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

    // Determine file type
    const fileType = file.type.startsWith('image/') ? 'image' 
                   : file.type.startsWith('video/') ? 'video'
                   : 'document';

    console.log(`Processing ${fileType} upload for user: ${user.id}`);

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
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    console.log(`File uploaded to: ${publicUrl}`);

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
      console.error('Media record error:', mediaError);
      return new Response(JSON.stringify({ error: mediaError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Media record created: ${mediaRecord.id}`);

    // If it's an image or video, analyze with AI
    let aiAnalysis = null;
    if (fileType === 'image' || fileType === 'video') {
      try {
        console.log('Starting AI analysis...');
        
        // Use Lovable AI vision model
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are Rocker, an AI assistant for Y'alls.ai, a horse industry platform. Analyze uploaded images and extract:
1. Horses present (names if visible, descriptions)
2. People present (descriptions)
3. Locations/venues
4. Activities/events (competitions, training, etc.)
5. Overall context and scene description

Respond in JSON format with: { "entities": [{"type": "horse"|"person"|"location"|"event", "name": "string", "confidence": 0-1}], "scene": "description", "emotion": "string", "context": "string" }`
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: context ? `User context: ${context}. Analyze this ${fileType}.` : `Analyze this ${fileType}.`
                  },
                  {
                    type: 'image_url',
                    image_url: { url: publicUrl }
                  }
                ]
              }
            ],
            max_tokens: 1000
          })
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI analysis failed:', aiResponse.status, errorText);
        } else {
          const aiResult = await aiResponse.json();
          const content = aiResult.choices?.[0]?.message?.content;
          
          if (content) {
            try {
              aiAnalysis = JSON.parse(content);
              console.log('AI analysis completed:', aiAnalysis);

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
                      p_tenant_id: '00000000-0000-0000-0000-000000000000',
                      p_limit: 1
                    });

                    if (matches && matches.length > 0) {
                      const match = matches[0];
                      console.log(`Found entity match: ${match.name} (${match.entity_type})`);
                      
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
              console.error('Failed to parse AI analysis:', e);
            }
          }
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        // Don't fail the upload if AI analysis fails
      }
    }

    // Audit log
    await supabase.rpc('audit_write', {
      p_actor: user.id,
      p_role: 'user',
      p_tenant: '00000000-0000-0000-0000-000000000000',
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
    console.error('Error in upload-media:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
