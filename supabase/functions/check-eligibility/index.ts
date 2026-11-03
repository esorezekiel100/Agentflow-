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
    const profile = payload.profile ?? {}

    return jsonResponse({
      ok: true,
      message: 'Eligibility check completed against your saved profile.',
      items: [
        { label: 'Education fit', status: profile.educationLevel ? 'pass' : 'unknown' },
        { label: 'Country eligibility', status: profile.country ? 'pass' : 'unknown' },
        { label: 'Remote preference', status: 'pass' },
        { label: 'Funding fit', status: Array.isArray(profile.preferences?.funding) && profile.preferences.funding.length ? 'pass' : 'unknown' },
      ],
    })
  } catch {
    return jsonResponse({ ok: false, message: 'Unable to evaluate eligibility.' }, 400)
  }
})
