import { z } from 'zod'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryLabels } from '../data/opportunities'
import { usePageMeta } from '../lib/seo'
import type { Category } from '../types'

const submissionSchema = z.object({
  title: z.string().trim().min(3, 'Opportunity title is required'),
  organization: z.string().trim().min(2, 'Organization name is required'),
  category: z.enum(['jobs', 'internships', 'graduate-programs', 'scholarships', 'bootcamps', 'grants', 'empowerment']),
  location: z.string().trim().min(2, 'Location is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  sourceUrl: z.string().url('Enter a valid source URL').or(z.literal('')),
  description: z.string().trim().min(20, 'Tell us more about the opportunity'),
})

type SubmissionForm = {
  title: string
  organization: string
  category: Category
  location: string
  deadline: string
  sourceUrl: string
  description: string
}

const initialForm: SubmissionForm = {
  title: '',
  organization: '',
  category: 'jobs',
  location: '',
  deadline: '',
  sourceUrl: '',
  description: '',
}

const storageKey = 'agentflow-opportunity-submissions-v1'

export function SubmitOpportunityPage() {
  usePageMeta({
    title: 'Submit an opportunity | AGENTFLOW',
    description: 'Share a new opportunity for review in the AGENTFLOW moderation queue.',
    path: '/submit-opportunity',
  })

  const [form, setForm] = useState<SubmissionForm>(initialForm)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const updateField = <K extends keyof SubmissionForm>(field: K, value: SubmissionForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (error) setError('')
    if (status) setStatus('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = submissionSchema.safeParse({
      ...form,
      sourceUrl: form.sourceUrl || '',
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please complete the form correctly.')
      setStatus('')
      return
    }

    const existing = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    const next = [...existing, { ...parsed.data, submittedAt: new Date().toISOString() }]
    localStorage.setItem(storageKey, JSON.stringify(next))

    setForm(initialForm)
    setError('')
    setStatus('Opportunity submitted to the moderation queue. We will review it within 24 hours.')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 via-slate-900 to-emerald-500/10 p-8">
        <div className="flex items-center gap-3 text-indigo-200">
          <Sparkles className="h-5 w-5" />
          <p className="text-sm uppercase tracking-[0.14em]">Community submissions</p>
        </div>
        <h1 className="mt-4 text-4xl font-black text-white">Share an opportunity with the AGENTFLOW community.</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Submit verified openings, training programs, grants and scholarships for moderation. We check legitimacy signals before publishing.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-xl font-bold text-white">Why submit?</h2>
          <ul className="mt-5 space-y-3 text-sm text-slate-300">
            <li className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">Help other applicants discover opportunities earlier.</li>
            <li className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">Build a safer, better-vetted directory across Africa and beyond.</li>
            <li className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">Faster moderation for scholarships, jobs, and grants.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm text-slate-300 md:col-span-2">
              <span className="mb-2 block">Opportunity title</span>
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Graduate Data Fellowship" />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Organization</span>
              <input value={form.organization} onChange={(event) => updateField('organization', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="BrightPath Foundation" />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Category</span>
              <select value={form.category} onChange={(event) => updateField('category', event.target.value as Category)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Location</span>
              <input value={form.location} onChange={(event) => updateField('location', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Kigali, Rwanda" />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Deadline</span>
              <input type="date" value={form.deadline} onChange={(event) => updateField('deadline', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>

            <label className="block text-sm text-slate-300 md:col-span-2">
              <span className="mb-2 block">Official source URL</span>
              <input value={form.sourceUrl} onChange={(event) => updateField('sourceUrl', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://example.org/opportunity" />
            </label>

            <label className="block text-sm text-slate-300 md:col-span-2">
              <span className="mb-2 block">Opportunity description</span>
              <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={5} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tell us what the program offers, who it is for, and how to apply." />
            </label>
          </div>

          {error ? <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div> : null}
          {status ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"><CheckCircle2 className="mt-0.5 h-4 w-4" /> <span>{status}</span></div> : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400">
              Submit for review <ArrowRight className="h-4 w-4" />
            </button>
            <Link to="/opportunities" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-indigo-400/40">
              Browse opportunities
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
