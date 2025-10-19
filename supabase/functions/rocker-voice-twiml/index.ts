import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const message = url.searchParams.get("message") || "an approval request";
    const approvalId = url.searchParams.get("approval_id");

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hi, this is Rocker calling about ${message}. ${
    approvalId ? `Please check your dashboard for approval ID ${approvalId}` : ""
  }</Say>
  <Pause length="1"/>
  <Say voice="alice">You can respond via text message or in the app. Thank you!</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/xml",
      },
    });
  } catch (error: any) {
    console.error("TwiML error:", error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error. Please try again.</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/xml",
      },
    });
  }
});
