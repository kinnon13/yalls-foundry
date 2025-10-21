import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'generate-event-form', RateLimits.expensive);
  if (limited) return limited;

  const log = createLogger('generate-event-form');
  log.startTimer();

  try {
    const { eventRules, formType, existingFields } = await req.json();

    log.info('Generating form for event', { formType });

    const systemPrompt = `You are an expert at designing equine event entry forms. Generate a structured form schema based on the event rules provided. Return ONLY valid JSON with this structure:
{
  "fields": [
    {
      "id": "unique_field_id",
      "type": "text|number|select|date|time|checkbox|file",
      "label": "Field Label",
      "required": true|false,
      "options": ["option1", "option2"],
      "validation": { "min": 0, "max": 100 },
      "help": "Help text"
    }
  ],
  "sections": [
    { "title": "Section Name", "fieldIds": ["field1", "field2"] }
  ]
}`;

    const userPrompt = `Create a ${formType} form for an equine event with these rules:
${eventRules}

${existingFields ? `Consider these existing fields: ${JSON.stringify(existingFields)}` : ''}

Generate comprehensive fields for:
- Horse registration info (barn name, registered name, breed, registry numbers)
- Rider/owner information
- Event-specific requirements (classes, divisions, age groups)
- Incentive program eligibility
- Payment and fee tracking
- Special requirements or waivers

Make it intuitive and complete.`;

    const { text } = await ai.chat({
      role: 'admin',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      maxTokens: 2000
    });

    const formSchema = JSON.parse(text);

    return new Response(JSON.stringify({ formSchema }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Error generating event form', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
