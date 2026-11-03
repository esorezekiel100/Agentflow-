import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoIndex, usePageMeta } from '../lib/seo'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'

export function AdminLoginPage() {
  useNoIndex()
  usePageMeta({
    title: 'Sign in | AGENTFLOW',
    description: 'Sign in to AGENTFLOW.',
    path: '/admin/login',
  })

  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!isSupabaseConfigured) {
        throw new Error('Admin sign-in is unavailable because Supabase is not configured.')
      }

      const { data, error: loginError } = await getSupabaseClient().functions.invoke<{
        access_token: string
        refresh_token: string
      }>('admin-login', { body: { email: email.trim(), password } })
      if (loginError) throw loginError
      if (!data?.access_token || !data.refresh_token) {
        throw new Error('Unable to sign in. Check your credentials and try again.')
      }

      const { error: sessionError } = await getSupabaseClient().auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
      if (sessionError) throw sessionError
      navigate('/admin', { replace: true })
    } catch (cause) {
      console.error('Admin sign-in failed:', cause)
      setError(cause instanceof Error ? cause.message : 'Unable to sign in right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#111827] px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">AGENTFLOW</p>
        <h1 className="mt-3 text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Use an authorized account to continue.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Email</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          {error ? <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
