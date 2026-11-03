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
    const opportunities = Array.isArray(payload.opportunities) && payload.opportunities.length
      ? payload.opportunities
      : [
          { title: 'Women in Tech Scholarship', remind_at: '2026-12-18T23:59:00Z', channel: 'email' },
          { title: 'AI Operations Coordinator', remind_at: '2026-12-20T23:59:00Z', channel: 'in-app' },
        ]

    return jsonResponse({
      ok: true,
      message: 'Reminder schedule prepared and ready to dispatch.',
      items: opportunities,
    })
  } catch {
    return jsonResponse({ ok: false, message: 'Unable to prepare deadline reminders.' }, 400)
  }
})
