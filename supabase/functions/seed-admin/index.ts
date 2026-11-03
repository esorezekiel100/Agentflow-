import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing server environment variable: ${name}`)
  return value
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

serve(async (request: Request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const seedToken = Deno.env.get('ADMIN_SEED_TOKEN')
  if (!seedToken || request.headers.get('x-admin-seed-token') !== seedToken) {
    return jsonResponse({ error: 'Not found.' }, 404)
  }

  try {
    const email = requiredEnv('ADMIN_EMAIL').trim().toLowerCase()
    const password = requiredEnv('ADMIN_PASSWORD')
    const admin = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: previousRun, error: previousRunError } = await admin
      .from('admin_seed_runs')
      .select('id')
      .eq('id', 1)
      .maybeSingle()
    if (previousRunError) throw previousRunError
    if (previousRun) return jsonResponse({ error: 'The initial admin seed has already been used.' }, 409)

    let userId: string | null = null
    for (let page = 1; page <= 20 && !userId; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) throw error
      userId = data.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null
      if (data.users.length < 1000) break
    }

    const creatingUser = !userId
    if (creatingUser) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error) throw error
      userId = data.user.id
    }
    if (!userId) throw new Error('Unable to resolve the initial admin user.')

    const { error: roleError } = await admin
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' })
    if (roleError) throw roleError

    const { error: securityError } = await admin
      .from('admin_security')
      .upsert({ user_id: userId, requires_password_change: creatingUser }, { onConflict: 'user_id' })
    if (securityError) throw securityError

    const { error: auditError } = await admin.from('admin_audit_log').insert({
      actor_user_id: userId,
      action: 'initial_admin_seeded',
      entity: 'user_role',
      entity_id: userId,
    })
    if (auditError) throw auditError

    const { error: markError } = await admin.from('admin_seed_runs').insert({ id: 1 })
    if (markError) throw markError

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('Initial admin seeding failed:', error)
    return jsonResponse({ error: 'Unable to seed the initial admin account.' }, 500)
  }
})
