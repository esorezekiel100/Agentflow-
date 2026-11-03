import { z } from 'zod'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePublishedOpportunities } from '../lib/opportunities'
import { usePageMeta } from '../lib/seo'
import { getSupabaseClient } from '../lib/supabase'

const reportSchema = z.object({
  reason: z.string().min(5, 'Please explain why you are reporting this listing'),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  details: z.string().trim().min(10, 'Add a few more details so the team can investigate.'),
})

export function ReportOpportunityPage() {
  const { slug } = useParams()
  const { opportunities, error: opportunitiesError, loading: opportunitiesLoading } = usePublishedOpportunities()
  const opportunity = opportunities.find((item) => item.slug === slug)

  usePageMeta({
    title: `Report listing | AGENTFLOW`,
    description: 'Report a suspicious listing and help the AGENTFLOW team protect applicants from scam or misleading opportunities.',
    path: `/report/${slug ?? ''}`,
  })

  const [form, setForm] = useState({ reason: '', email: '', details: '' })
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (error) setError('')
    if (status) setStatus('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = reportSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please complete the report.');
      setStatus('')
      return
    }

    try {
      const client = getSupabaseClient()
      const [{ data: { session }, error: sessionError }, { data: listing, error: listingError }] = await Promise.all([
        client.auth.getSession(),
        client.from('opportunities').select('id').eq('slug', slug ?? '').maybeSingle(),
      ])
      if (sessionError) throw sessionError
      if (listingError) throw listingError

      const { error: insertError } = await client.from('reports').insert({
        opportunity_id: listing?.id ?? null,
        opportunity_slug: slug ?? null,
        user_id: session?.user.id ?? null,
        reason: parsed.data.reason.trim(),
        details: parsed.data.details.trim(),
        contact_email: parsed.data.email || null,
      })
      if (insertError) throw insertError

      setError('')
      setStatus('Your report has been received and will be reviewed by the moderation team.')
      setForm({ reason: '', email: '', details: '' })
    } catch (cause) {
      console.error('Unable to submit scam report:', cause)
      setError(cause instanceof Error ? cause.message : 'Unable to submit this report.')
      setStatus('')
    }
  }

  if (!opportunity) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p role={opportunitiesError ? 'alert' : undefined} className="text-2xl font-bold text-[#172234]">
          {opportunitiesLoading ? 'Loading opportunity...' : opportunitiesError ? `Unable to load opportunity: ${opportunitiesError}` : 'Opportunity not found'}
        </p>
        <Link to="/opportunities" className="mt-5 inline-flex rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white">Back to browse</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
        <div className="flex items-center gap-3 text-[#9f302a]">
          <ShieldAlert className="h-5 w-5" />
          <p className="text-sm uppercase tracking-[0.14em]">Report listing</p>
        </div>
        <h1 className="mt-4 text-3xl font-black text-[#702d2b]">Help us review {opportunity.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <div className="space-y-5">
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">What looks wrong?</span>
            <input value={form.reason} onChange={(event) => updateField('reason', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Payment requested before selection" />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Email (optional)</span>
            <input value={form.email} onChange={(event) => updateField('email', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com" />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="mb-2 block">Tell us more</span>
            <textarea value={form.details} onChange={(event) => updateField('details', event.target.value)} rows={5} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Describe the suspicious payment request, unclear details, mismatch, or pressure tactics." />
          </label>
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div> : null}
        {status ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"><CheckCircle2 className="mt-0.5 h-4 w-4" /> <span>{status}</span></div> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" className="rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400">Submit report</button>
          <Link to={`/opportunity/${opportunity.slug}`} className="rounded-full border border-white/10 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-indigo-400/40">Back to listing</Link>
        </div>
      </form>
    </div>
  )
}
