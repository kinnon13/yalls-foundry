import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventRules, formType, existingFields } = await req.json();

    console.log('Generating form for:', { formType, eventRules });

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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const formSchema = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify({ formSchema }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-event-form:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
