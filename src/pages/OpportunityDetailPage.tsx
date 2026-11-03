import { Check, Clock3, ExternalLink, MapPin, ShieldCheck, Sparkles, Star, Users } from 'lucide-react'
import { useEffect } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { categoryLabels, opportunitySeed } from '../data/opportunities'
import { usePublishedOpportunities } from '../lib/opportunities'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import { useJsonLd, usePageMeta } from '../lib/seo'
import { formatCompactDate, formatDeadline } from '../lib/utils'

const sampleProfile: {
  country: string
  educationLevel: 'secondary' | 'diploma' | 'bachelor' | 'masters' | 'phd'
  fieldOfStudy: string
  skills: string[]
  interests: string[]
} = {
  country: 'Nigeria',
  educationLevel: 'bachelor',
  fieldOfStudy: 'Computer Science',
  skills: ['TypeScript', 'Product thinking', 'Research'],
  interests: ['jobs', 'scholarships'],
}

function getEligibilityStatus(opportunity: (typeof opportunitySeed)[number]) {
  const checks = [
    {
      label: 'Education match',
      passed: opportunity.educationLevels.includes(sampleProfile.educationLevel),
    },
    {
      label: 'Field alignment',
      passed: opportunity.field.toLowerCase().includes('computer') || opportunity.field.toLowerCase().includes('data') || opportunity.field.toLowerCase().includes('design') || opportunity.field.toLowerCase().includes('product'),
    },
    {
      label: 'Location preference',
      passed: opportunity.country === sampleProfile.country || opportunity.workMode !== 'onsite',
    },
  ]

  return checks
}

export function OpportunityDetailPage() {
  const { slug } = useParams()
  const { opportunities, error: opportunitiesError, loading: opportunitiesLoading } = usePublishedOpportunities()
  const opportunity = opportunities.find((item) => item.slug === slug)
  const opportunityId = opportunity?.id
  const navigate = useNavigate()
  const [savedState, setSavedState] = useState<{ id: string; saved: boolean } | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const isSaved = Boolean(savedState && savedState.id === opportunityId && savedState.saved)

  useEffect(() => {
    if (!opportunityId || !isSupabaseConfigured || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(opportunityId)) return
    let active = true
    const recordView = async () => {
      try {
        const client = getSupabaseClient()
        const { data: { session }, error: sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        if (!session) return
        const { error } = await client.from('opportunity_views').insert({
          opportunity_id: opportunityId,
          viewer_id: session.user.id,
        })
        if (error) throw error
      } catch (error) {
        if (active) console.error('Unable to record opportunity view:', error)
      }
    }
    void recordView()
    return () => { active = false }
  }, [opportunityId])

  useEffect(() => {
    if (!opportunityId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(opportunityId)) return
    let active = true
    const loadSavedState = async () => {
      try {
        const client = getSupabaseClient()
        const { data: { session }, error: sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        if (!session) return
        const { data, error } = await client.from('saved_opportunities')
          .select('opportunity_id')
          .eq('user_id', session.user.id)
          .eq('opportunity_id', opportunityId)
          .maybeSingle()
        if (error) throw error
        if (active) setSavedState({ id: opportunityId, saved: Boolean(data) })
      } catch (error) {
        if (active) console.error('Unable to load saved opportunity state:', error)
      }
    }
    void loadSavedState()
    return () => { active = false }
  }, [opportunityId])

  const resolveOpportunityId = async () => {
    if (!opportunity) throw new Error('Opportunity is unavailable.')
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(opportunity.id)) {
      return opportunity.id
    }
    const { data, error } = await getSupabaseClient().from('opportunities').select('id').eq('slug', opportunity.slug).maybeSingle()
    if (error) throw error
    if (!data) throw new Error('This opportunity is not yet available in your account database.')
    return data.id
  }

  const toggleSave = async () => {
    setActionMessage('')
    setActionBusy(true)
    try {
      const client = getSupabaseClient()
      const { data: { session }, error: sessionError } = await client.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) {
        navigate('/auth')
        return
      }
      const databaseId = await resolveOpportunityId()
      if (isSaved) {
        const { error } = await client.from('saved_opportunities')
          .delete()
          .eq('user_id', session.user.id)
          .eq('opportunity_id', databaseId)
        if (error) throw error
        setSavedState({ id: databaseId, saved: false })
        setActionMessage('Removed from saved opportunities.')
      } else {
        const { error } = await client.from('saved_opportunities').upsert({
          user_id: session.user.id,
          opportunity_id: databaseId,
        }, { onConflict: 'user_id,opportunity_id' })
        if (error) throw error
        setSavedState({ id: databaseId, saved: true })
        setActionMessage('Opportunity saved.')
      }
    } catch (error) {
      console.error('Unable to save opportunity:', error)
      setActionMessage(error instanceof Error ? error.message : 'Unable to save this opportunity.')
    } finally {
      setActionBusy(false)
    }
  }

  const addToTracker = async () => {
    setActionMessage('')
    setActionBusy(true)
    try {
      const client = getSupabaseClient()
      const { data: { session }, error: sessionError } = await client.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) {
        navigate('/auth')
        return
      }
      const databaseId = await resolveOpportunityId()
      const { data: existing, error: lookupError } = await client.from('applications')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('opportunity_id', databaseId)
        .limit(1)
      if (lookupError) throw lookupError
      if (existing.length) {
        setActionMessage('This opportunity is already in your application tracker.')
        return
      }
      const { error } = await client.from('applications').insert({
        user_id: session.user.id,
        opportunity_id: databaseId,
        stage: 'saved',
      })
      if (error) throw error
      setActionMessage('Opportunity added to your application tracker.')
    } catch (error) {
      console.error('Unable to add opportunity to tracker:', error)
      setActionMessage(error instanceof Error ? error.message : 'Unable to add this opportunity to your tracker.')
    } finally {
      setActionBusy(false)
    }
  }

  usePageMeta({
    title: opportunity ? `${opportunity.title} | AGENTFLOW` : 'Opportunity not found | AGENTFLOW',
    description: opportunity ? `${opportunity.organization} — ${opportunity.description}` : 'Browse the AGENTFLOW opportunity details.',
    path: opportunity ? `/opportunity/${opportunity.slug}` : '/opportunities',
  })

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: opportunity?.title ?? 'Opportunity',
    description: opportunity?.description ?? '',
    hiringOrganization: {
      '@type': 'Organization',
      name: opportunity?.organization ?? '',
    },
    datePosted: opportunity?.createdAt,
    validThrough: opportunity?.deadline || undefined,
    employmentType: opportunity?.workMode ?? 'remote',
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: opportunity?.country ?? 'NG',
      },
    },
    url: opportunity ? `https://example.com/opportunity/${opportunity.slug}` : 'https://example.com/opportunities',
  })

  if (!opportunity) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p role={opportunitiesError ? 'alert' : undefined} className="text-2xl font-bold text-[#172234]">
          {opportunitiesLoading ? 'Loading opportunity...' : opportunitiesError ? `Unable to load opportunity: ${opportunitiesError}` : 'Opportunity not found'}
        </p>
        <Link to="/opportunities" className="mt-4 inline-flex rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white">Back to browse</Link>
      </div>
    )
  }

  const eligibilityChecks = getEligibilityStatus(opportunity)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#526172]">
        <Link to="/" className="hover:text-[#172234]">Home</Link>
        <span>/</span>
        <Link to={`/category/${opportunity.category}`} className="hover:text-[#172234]">{categoryLabels[opportunity.category]}</Link>
        <span>/</span>
        <span className="text-[#647080]">{opportunity.title}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-200">
                {categoryLabels[opportunity.category]}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                {opportunity.isVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-black text-white">{opportunity.title}</h1>
            <p className="mt-3 text-xl text-slate-300">{opportunity.organization}</p>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {opportunity.location}</span>
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-200" /> {formatDeadline(opportunity.deadline)}</span>
              <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-emerald-200" /> {opportunity.matchScore ?? 88}% match</span>
            </div>

            <p className="mt-6 text-base leading-7 text-slate-300">{opportunity.description}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" disabled={actionBusy} onClick={() => void toggleSave()} className="rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60">{isSaved ? 'Saved' : 'Save'}</button>
              <button type="button" disabled={actionBusy} onClick={() => void addToTracker()} className="rounded-full border border-white/10 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40 disabled:opacity-60">Add to tracker</button>
              <button type="button" className="rounded-full border border-white/10 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/40">Set reminder</button>
              <Link to={`/report/${opportunity.slug}`} className="rounded-full border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20">Report this listing</Link>
            </div>
            {actionMessage ? <p role="status" className="mt-3 text-sm text-slate-300">{actionMessage}</p> : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Funding</p>
                <p className="mt-2 text-base font-semibold text-white">{opportunity.fundingType}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Work mode</p>
                <p className="mt-2 text-base font-semibold text-white">{opportunity.workMode}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Deadline</p>
                <p className="mt-2 text-base font-semibold text-white">{formatCompactDate(opportunity.deadline)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-bold text-white">Eligibility</h2>
            <p className="mt-4 text-slate-300">{opportunity.eligibilityText}</p>

            <div className="mt-6 space-y-3">
              {eligibilityChecks.map((check) => (
                <div key={check.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm">
                  <span className="text-slate-200">{check.label}</span>
                  <span className={check.passed ? 'text-emerald-300' : 'text-red-300'}>
                    {check.passed ? 'Pass' : 'Review'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-bold text-white">Benefits</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {opportunity.benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-200">
                  <Check className="h-4 w-4 text-emerald-300" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-bold text-white">How to apply</h2>
            <p className="mt-4 text-slate-300">{opportunity.howToApply}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={opportunity.applyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
                Apply now <ExternalLink className="h-4 w-4" />
              </a>
              <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-indigo-400/40">
                Official source <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 to-slate-900 p-6">
            <div className="flex items-center gap-3 text-indigo-200">
              <ShieldCheck className="h-5 w-5" />
              <p className="font-semibold">Legitimacy panel</p>
            </div>
            <div className="mt-5 text-5xl font-black text-white">{opportunity.legitimacyScore}</div>
            <div className="mt-2 h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${opportunity.legitimacyScore}%` }} />
            </div>
            <p className="mt-4 text-sm text-slate-300">{opportunity.legitimacyReasons.join(' • ')}</p>
            <p className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              This is an automated assessment, verify on the official site.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="flex items-center gap-3 text-slate-100">
              <Sparkles className="h-5 w-5 text-indigo-200" />
              <h2 className="text-xl font-bold">AI assistant</h2>
            </div>
            <Link to="/agent" className="mt-5 block w-full rounded-full bg-indigo-500 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-400">Draft my application</Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="flex items-center gap-3 text-slate-100">
              <Users className="h-5 w-5 text-emerald-200" />
              <h2 className="text-xl font-bold">Related opportunities</h2>
            </div>
            <div className="mt-4 space-y-3">
              {opportunities.filter((item) => item.category === opportunity.category && item.id !== opportunity.id).slice(0, 3).map((item) => (
                <Link key={item.id} to={`/opportunity/${item.slug}`} className="block rounded-2xl border border-white/10 bg-slate-950/60 p-3 transition hover:border-indigo-400/40">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.organization}</p>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
