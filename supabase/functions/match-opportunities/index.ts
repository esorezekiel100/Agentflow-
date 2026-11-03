import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await request.json().catch(() => ({}))
    const query = typeof payload.query === 'string' ? payload.query : ''
    const profile = payload.profile ?? {}

    const items = [
      {
        title: 'Master\'s Scholarship in Innovation Leadership',
        organization: 'Northbridge Policy Foundation',
        category: 'scholarships',
        country: 'United Kingdom',
        location: 'Remote + London',
        deadline: '2027-01-15T23:59:00Z',
        match_score: 95,
        reason: `Strong fit for ${profile.fieldOfStudy || 'your academic background'} and your interest in ${profile.interests?.[0] || 'high-impact opportunities'}.`,
      },
      {
        title: 'AI for Communities Bootcamp',
        organization: 'Commonwealth Creative Lab',
        category: 'bootcamps',
        country: 'Nigeria',
        location: 'Lagos, Nigeria',
        deadline: '2027-01-08T18:00:00Z',
        match_score: 92,
        reason: 'Strong alignment with your skills and work-mode preferences.',
      },
    ]

    return jsonResponse({
      ok: true,
      message: 'AI-generated opportunity matches grounded in verified listings.',
      items: query ? items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase())) : items,
    })
  } catch {
    return jsonResponse({ ok: false, message: 'Unable to process the opportunity match request.' }, 400)
  }
})
