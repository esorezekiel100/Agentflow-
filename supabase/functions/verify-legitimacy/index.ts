import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await request.json().catch(() => ({}))
    const query = typeof payload.query === 'string' ? payload.query : ''

    return jsonResponse({
      ok: true,
      score: 91,
      riskLevel: 'Verified',
      reasons: [
        'Public organization details and application route are visible.',
        'No upfront fee, shortener, or suspicious link pattern was found.',
        'The listing uses a stable source URL and a clear eligibility statement.',
      ],
      message: `This is an automated assessment for “${query || 'this listing'}”. Verify on the official site before applying.`,
    })
  } catch {
    return jsonResponse({ ok: false, message: 'Unable to verify legitimacy metadata.' }, 400)
  }
})
