# AGENTFLOW

## Local development

1. Copy `.env.example` to `.env.local` and set the public Supabase URL and anon key.
2. Run `npm install`, then `npm run dev`.
3. Apply `supabase/schema.sql` to the Supabase project before using the admin panel or community submission/report queues.

## Admin setup

The admin UI is intentionally unlinked from public navigation. Admin sign-in is at `/admin/login`; the panel at `/admin` is rendered only after Supabase confirms the `admin` role. Both routes set `noindex, nofollow`. Admin writes are enforced by database RLS; hiding routes is not an authorization boundary.

Apply the schema before deploying the `admin-login` and `seed-admin` Edge Functions. Keep all of the following as Supabase Edge Function secrets, never in Vite variables or client-side files:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SEED_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`

The `admin-login` function also uses the Supabase-provided `SUPABASE_URL` and `SUPABASE_ANON_KEY`. It atomically reserves up to five attempts per IP/email in a rolling 15-minute window, verifies the account role server-side, and audits successful admin sign-ins.

Invoke `seed-admin` once using the `x-admin-seed-token` header set to the secret `ADMIN_SEED_TOKEN`. The function creates the account if needed, assigns the role in `user_roles`, and rejects subsequent seed calls. If it created the account from the configured seed password, the panel requires a password change at first sign-in. Rotate the seed credentials and token after provisioning, and remove or disable the seed function after the one-time setup.

Enable TOTP/MFA for the Supabase Auth project to allow admins to enroll an authenticator and complete an MFA challenge before using the panel. Keep a second trusted admin account available before changing role assignments.
