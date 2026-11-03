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
    const name = payload.profile?.fullName || 'Applicant'
    const field = payload.profile?.fieldOfStudy || 'your relevant field'

    return jsonResponse({
      ok: true,
      kind: 'cover-letter',
      content: `Dear Hiring Manager,\n\nI am writing to express my strong interest in this opportunity. My background in ${field} has prepared me to contribute meaningfully to your mission and team. I am particularly drawn to the role because it aligns with my academic training, practical skills, and career goals.\n\nI would welcome the opportunity to bring my work ethic, curiosity, and communication skills to your organization. Thank you for considering my application.\n\nSincerely,\n${name}`,
      message: 'AI-generated draft created from your saved profile and the opportunity brief.',
    })
  } catch {
    return jsonResponse({ ok: false, message: 'Unable to draft a tailored application.' }, 400)
  }
})
