import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
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

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing server environment variable: ${name}`)
  return value
}

serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!email || email.length > 254 || !password || password.length > 1024) {
      return jsonResponse({ error: 'Invalid credentials.' }, 400)
    }

    const url = requiredEnv('SUPABASE_URL')
    const anonKey = requiredEnv('SUPABASE_ANON_KEY')
    const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const ip = request.headers.get('cf-connecting-ip')
      ?? request.headers.get('x-real-ip')
      ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? 'unknown'

    const { data: rateLimited, error: limitError } = await service.rpc('check_admin_login_rate_limit', {
      p_email: email,
      p_ip: ip,
    })
    if (limitError) throw limitError
    if (rateLimited) return jsonResponse({ error: 'Unable to sign in. Try again in 15 minutes.' }, 429)

    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: login, error: loginError } = await authClient.auth.signInWithPassword({ email, password })
    if (loginError || !login.user || !login.session) {
      return jsonResponse({ error: 'Unable to sign in. Check your credentials and try again.' }, 401)
    }

    const { data: role, error: roleError } = await service
      .from('user_roles')
      .select('role')
      .eq('user_id', login.user.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (roleError) throw roleError
    if (!role) {
      const { error: signOutError } = await authClient.auth.signOut()
      if (signOutError) console.error('Unable to close rejected admin login session:', signOutError)
      return jsonResponse({ error: 'Not found.' }, 404)
    }

    const { data: security, error: securityError } = await service
      .from('admin_security')
      .select('requires_password_change')
      .eq('user_id', login.user.id)
      .maybeSingle()
    if (securityError) throw securityError

    const { error: auditError } = await service.from('admin_audit_log').insert({
      actor_user_id: login.user.id,
      action: 'signed_in',
      entity: 'admin_auth',
      details: { client_ip: ip },
    })
    if (auditError) throw auditError

    const { error: clearEmailError } = await service.from('admin_login_attempts').delete().eq('email', email)
    if (clearEmailError) throw clearEmailError
    const { error: clearIpError } = await service.from('admin_login_attempts').delete().eq('client_ip', ip)
    if (clearIpError) throw clearIpError

    return jsonResponse({
      access_token: login.session.access_token,
      refresh_token: login.session.refresh_token,
      requires_password_change: security?.requires_password_change === true,
    })
  } catch (error) {
    console.error('Admin login request failed:', error)
    return jsonResponse({ error: 'Admin sign-in is temporarily unavailable.' }, 500)
  }
})
