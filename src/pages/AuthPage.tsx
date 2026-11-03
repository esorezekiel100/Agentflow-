import { z } from 'zod'
import { ArrowRight, BriefcaseBusiness, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../lib/auth'

const authSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
  fullName: z.string().trim().min(2, 'Add your full name').optional(),
})

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async () => {
    const parsed = authSchema.safeParse({
      email: form.email,
      password: form.password,
      fullName: mode === 'signup' ? form.fullName : undefined,
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please complete the form correctly.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const result = mode === 'signin'
      ? await signInWithEmail({ email: form.email, password: form.password })
      : await signUpWithEmail({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
        })

    if (!result.ok) {
      setError(result.message ?? 'Authentication failed.')
      setLoading(false)
      return
    }

    setSuccess(result.message ?? 'Success!')
    setLoading(false)

    if (result.needsRedirect) {
      navigate('/onboarding')
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    const result = await signInWithGoogle()
    if (!result.ok) {
      setError(result.message ?? 'Google sign-in failed.')
      setLoading(false)
      return
    }

    setSuccess(result.message ?? 'Redirecting...')
    setLoading(false)

    if (result.needsRedirect) {
      navigate('/onboarding')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 shadow-2xl shadow-slate-950/30 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-gradient-to-br from-indigo-500/15 via-slate-900 to-emerald-500/10 p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.16em] text-indigo-200">Welcome back</p>
          <h1 className="mt-4 text-4xl font-black text-white">Build a smarter opportunity pipeline.</h1>
          <p className="mt-4 max-w-lg text-slate-300">
            Save searches, match opportunities to your profile, and track applications without missing deadlines.
          </p>

          <div className="mt-8 space-y-4">
            {[
              'Personalized opportunity matching',
              'Eligibility checks before you apply',
              'Real deadline reminders and AI drafts',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-6 inline-flex rounded-full border border-white/10 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === 'signin' ? 'bg-indigo-500 text-white' : 'text-slate-300'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === 'signup' ? 'bg-indigo-500 text-white' : 'text-slate-300'
              }`}
            >
              Create account
            </button>
          </div>

          <div className="space-y-5">
            <button type="button" onClick={handleGoogle} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-400/40 disabled:cursor-not-allowed disabled:opacity-70">
              <BriefcaseBusiness className="h-4 w-4 text-indigo-200" />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-slate-500">
              <div className="h-px flex-1 bg-white/10" />
              or with email
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {mode === 'signup' ? (
              <label className="block text-sm text-slate-300">
                <span className="mb-2 block">Full name</span>
                <input
                  value={form.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  type="text"
                  placeholder="Ada Okafor"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            ) : null}

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Email</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Password</span>
              <input
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{success}</div>
            ) : null}

            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in to AGENTFLOW' : 'Create my account'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-sm text-slate-400">
              {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}{' '}
              <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="font-semibold text-indigo-200 hover:text-indigo-100">
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </p>

            <Link to="/onboarding" className="block text-center text-sm text-emerald-200 hover:text-emerald-100">
              Continue to onboarding →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
