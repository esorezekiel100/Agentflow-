import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, Check, FileUp, LogOut, Plus, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { categoryLabels } from '../data/opportunities'
import { useNoIndex, usePageMeta } from '../lib/seo'
import { getSupabaseClient } from '../lib/supabase'
import { formatCompactDate } from '../lib/utils'
import type { Category } from '../types'

type OpportunityRow = {
  id: string
  slug: string
  title: string
  organization: string
  category: Category
  description: string
  eligibility_text: string | null
  benefits: string[] | null
  funding_type: string
  location: string
  country: string
  work_mode: string
  education_levels: string[] | null
  apply_url: string | null
  source_url: string | null
  deadline: string | null
  status: 'published' | 'draft' | 'archived'
  is_verified: boolean
  legitimacy_score: number | null
}

type SubmissionRow = {
  id: string
  title: string
  organization: string
  category: Category
  description: string
  eligibility_text: string | null
  funding_type: string
  location: string
  country: string
  work_mode: string
  deadline: string | null
  source_url: string | null
  apply_url: string | null
  status: string
  created_at: string
}

type ReportRow = {
  id: string
  opportunity_id: string | null
  opportunity_slug: string | null
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'dismissed'
  created_at: string
  opportunity: { title: string } | null
}

type AnalyticsRow = {
  category: string
  views: number
  saves: number
  applications: number
}

type AdminRole = { user_id: string; role: string; created_at: string }

type EditorState = Omit<OpportunityRow, 'id' | 'slug' | 'benefits' | 'education_levels' | 'status'> & {
  id?: string
  benefitsText: string
  educationText: string
}

const categories = Object.keys(categoryLabels) as Category[]
const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500'
const labelClass = 'block space-y-1.5 text-sm text-slate-300'
const emptyEditor: EditorState = {
  title: '',
  organization: '',
  category: 'jobs',
  description: '',
  eligibility_text: '',
  funding_type: 'paid',
  location: '',
  country: '',
  work_mode: 'remote',
  deadline: '',
  source_url: '',
  apply_url: '',
  is_verified: false,
  legitimacy_score: 0,
  benefitsText: '',
  educationText: '',
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

function currentIsoTimestamp() {
  return new Date().toISOString()
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      row.push(cell.trim())
      cell = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }
  if (quoted) throw new Error('The CSV contains an unclosed quoted field.')
  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  if (rows.length < 2) throw new Error('The CSV must include a header row and at least one opportunity.')

  const headers = rows[0].map((header) => header.toLowerCase().replace(/\s+/g, '_'))
  const required = ['title', 'organization', 'category', 'description']
  const missing = required.filter((header) => !headers.includes(header))
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(', ')}.`)

  return rows.slice(1).map((cells, rowIndex) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
    for (const requiredField of required) {
      if (!record[requiredField]) throw new Error(`Row ${rowIndex + 2} is missing ${requiredField}.`)
    }
    if (!categories.includes(record.category as Category)) throw new Error(`Row ${rowIndex + 2} has an unsupported category.`)
    return {
      slug: slugify(record.title),
      title: record.title,
      organization: record.organization,
      category: record.category,
      description: record.description,
      eligibility_text: record.eligibility_text || null,
      benefits: record.benefits ? record.benefits.split('|').map((item) => item.trim()).filter(Boolean) : [],
      funding_type: record.funding_type || 'paid',
      location: record.location || 'Remote',
      country: record.country || 'Global',
      work_mode: record.work_mode || 'remote',
      education_levels: [],
      deadline: record.deadline || null,
      source_url: record.source_url || null,
      apply_url: record.apply_url || null,
      status: 'published' as const,
      is_verified: record.is_verified?.toLowerCase() === 'true',
      legitimacy_score: Number(record.legitimacy_score) || 0,
    }
  })
}

function fieldValue(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  return event.target.value
}

export default function AdminPage() {
  useNoIndex()
  usePageMeta({
    title: 'Admin dashboard | AGENTFLOW',
    description: 'AGENTFLOW administration.',
    path: '/admin',
  })

  const client = getSupabaseClient()
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([])
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [audit, setAudit] = useState<Array<{ id: string; action: string; entity: string; created_at: string }>>([])
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [roleUserId, setRoleUserId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [mfaMode, setMfaMode] = useState<'loading' | 'setup' | 'challenge' | 'ready'>('loading')
  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [mfaQrCode, setMfaQrCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaBusy, setMfaBusy] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await client.auth.getUser()
      if (userError) throw userError
      if (!user) {
        navigate('/admin/login', { replace: true })
        return
      }
      setError('')
      setUserId(user.id)

      const [opportunityResult, submissionResult, reportResult, analyticsResult, roleResult, auditResult, securityResult] = await Promise.all([
        client.from('opportunities').select('*').order('created_at', { ascending: false }).limit(500),
        client.from('opportunity_submissions').select('*').order('created_at', { ascending: false }).limit(200),
        client.from('reports').select('id, opportunity_id, reason, details, status, created_at, opportunity:opportunities(title)').order('created_at', { ascending: false }).limit(200),
        client.from('admin_analytics').select('*').order('category'),
        client.from('user_roles').select('user_id, role, created_at').order('created_at', { ascending: false }).limit(500),
        client.from('admin_audit_log').select('id, action, entity, created_at').order('created_at', { ascending: false }).limit(30),
        client.from('admin_security').select('requires_password_change').eq('user_id', user.id).maybeSingle(),
      ])
      const results = [opportunityResult, submissionResult, reportResult, analyticsResult, roleResult, auditResult, securityResult]
      const failed = results.find((result) => result.error)
      if (failed?.error) throw failed.error

      setOpportunities(opportunityResult.data ?? [])
      setSubmissions(submissionResult.data ?? [])
      setReports((reportResult.data ?? []) as unknown as ReportRow[])
      setAnalytics((analyticsResult.data ?? []) as AnalyticsRow[])
      setRoles(roleResult.data ?? [])
      setAudit(auditResult.data ?? [])
      setRequiresPasswordChange(securityResult.data?.requires_password_change === true)

      const { data: factors, error: factorError } = await client.auth.mfa.listFactors()
      if (factorError) throw factorError
      const verifiedTotp = factors.totp.find((factor) => factor.status === 'verified')
      if (!verifiedTotp) {
        setMfaMode('setup')
      } else {
        setFactorId(verifiedTotp.id)
        const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel()
        if (assuranceError) throw assuranceError
        setMfaMode(assurance.currentLevel === 'aal2' ? 'ready' : 'challenge')
      }
    } catch (cause) {
      console.error('Unable to load admin panel:', cause)
      setError(errorText(cause))
      setMfaMode('setup')
    } finally {
      setLoading(false)
    }
  }, [client, navigate])

  // This effect synchronizes dashboard state with Supabase after protected route entry.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { void loadDashboard() }, [loadDashboard])

  const summary = useMemo(() => ({
    published: opportunities.filter((item) => item.status === 'published').length,
    pending: submissions.filter((item) => item.status === 'pending').length,
    reports: reports.filter((item) => item.status === 'pending').length,
  }), [opportunities, reports, submissions])

  const saveOpportunity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editor) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const values = {
        slug: slugify(editor.title),
        title: editor.title.trim(),
        organization: editor.organization.trim(),
        category: editor.category,
        description: editor.description.trim(),
        eligibility_text: editor.eligibility_text?.trim() || null,
        benefits: editor.benefitsText.split('\n').map((item) => item.trim()).filter(Boolean),
        funding_type: editor.funding_type,
        location: editor.location.trim(),
        country: editor.country.trim(),
        work_mode: editor.work_mode,
        education_levels: editor.educationText.split(',').map((item) => item.trim()).filter(Boolean),
        deadline: editor.deadline || null,
        source_url: editor.source_url || null,
        apply_url: editor.apply_url || null,
        status: 'published' as const,
        is_verified: editor.is_verified,
        legitimacy_score: Math.max(0, Math.min(100, Number(editor.legitimacy_score) || 0)),
        created_by: userId,
      }
      if (!values.title || !values.organization || !values.description || !values.location || !values.country) {
        throw new Error('Title, organization, description, location, and country are required.')
      }
      const result = editor.id
        ? await client.from('opportunities').update(values).eq('id', editor.id).select('id').single()
        : await client.from('opportunities').insert(values).select('id').single()
      if (result.error) throw result.error
      setEditor(null)
      setNotice('Opportunity saved.')
      await loadDashboard()
    } catch (cause) {
      console.error('Unable to save opportunity:', cause)
      setError(errorText(cause))
    } finally {
      setSaving(false)
    }
  }

  const deleteOpportunity = async (item: OpportunityRow) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    setError('')
    try {
      const { error: deleteError } = await client.from('opportunities').delete().eq('id', item.id)
      if (deleteError) throw deleteError
      setNotice('Opportunity deleted.')
      await loadDashboard()
    } catch (cause) {
      console.error('Unable to delete opportunity:', cause)
      setError(errorText(cause))
    }
  }

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setNotice('')
    try {
      const items = parseCsv(await file.text())
      const { error: importError } = await client.from('opportunities').upsert(items, { onConflict: 'slug' })
      if (importError) throw importError
      setNotice(`Imported ${items.length} opportunities.`)
      await loadDashboard()
    } catch (cause) {
      console.error('Unable to import CSV:', cause)
      setError(errorText(cause))
    }
  }

  const reviewSubmission = async (item: SubmissionRow, approve: boolean) => {
    setError('')
    try {
      if (approve) {
        const { error: opportunityError } = await client.from('opportunities').insert({
          slug: `${slugify(item.title)}-${item.id.slice(0, 8)}`,
          title: item.title,
          organization: item.organization,
          category: item.category,
          description: item.description,
          eligibility_text: item.eligibility_text,
          funding_type: item.funding_type,
          location: item.location,
          country: item.country,
          work_mode: item.work_mode,
          deadline: item.deadline,
          source_url: item.source_url,
          apply_url: item.apply_url,
          status: 'published',
          created_by: userId,
        })
        if (opportunityError) throw opportunityError
      }
      const { error: updateError } = await client.from('opportunity_submissions')
        .update({ status: approve ? 'approved' : 'rejected', reviewed_by: userId, reviewed_at: currentIsoTimestamp() })
        .eq('id', item.id)
      if (updateError) throw updateError
      setNotice(approve ? 'Submission approved and published.' : 'Submission rejected.')
      await loadDashboard()
    } catch (cause) {
      console.error('Unable to review submission:', cause)
      setError(errorText(cause))
    }
  }

  const updateReport = async (report: ReportRow, status: 'reviewed' | 'dismissed') => {
    setError('')
    try {
      const { error: updateError } = await client.from('reports').update({ status }).eq('id', report.id)
      if (updateError) throw updateError
      setNotice(`Report marked ${status}.`)
      await loadDashboard()
    } catch (cause) {
      console.error('Unable to update report:', cause)
      setError(errorText(cause))
    }
  }

  const toggleAdminRole = async (targetUserId: string, isAdmin: boolean) => {
    const normalizedId = targetUserId.trim()
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizedId)) {
      setError('Enter a valid user UUID.')
      return
    }
    if (isAdmin && normalizedId === userId) {
      setError('Your own admin role cannot be changed here.')
      return
    }
    setError('')
    try {
      const result = isAdmin
        ? await client.from('user_roles').update({ role: 'member' }).eq('user_id', normalizedId).eq('role', 'admin')
        : await client.from('user_roles').upsert({ user_id: normalizedId, role: 'admin' }, { onConflict: 'user_id' })
      if (result.error) throw result.error
      setRoleUserId('')
      setNotice(isAdmin ? 'Admin role revoked.' : 'Admin role granted.')
      await loadDashboard()
    } catch (cause) {
      console.error('Unable to update user role:', cause)
      setError(errorText(cause))
    }
  }

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (newPassword.length < 12) {
      setError('Choose a password with at least 12 characters.')
      return
    }
    try {
      const { error: passwordError } = await client.auth.updateUser({ password: newPassword })
      if (passwordError) throw passwordError
      const { error: clearError } = await client.rpc('complete_admin_password_change')
      if (clearError) throw clearError
      setRequiresPasswordChange(false)
      setNewPassword('')
      setNotice('Admin password changed.')
    } catch (cause) {
      console.error('Unable to update admin password:', cause)
      setError(errorText(cause))
    }
  }

  const startMfaSetup = async () => {
    setMfaBusy(true)
    setError('')
    try {
      const { data, error: enrollError } = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'AGENTFLOW admin' })
      if (enrollError) throw enrollError
      setFactorId(data.id)
      setMfaQrCode(data.totp.qr_code)
      setMfaSecret(data.totp.secret)
      const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: data.id })
      if (challengeError) throw challengeError
      setChallengeId(challenge.id)
      setMfaMode('setup')
    } catch (cause) {
      console.error('Unable to start MFA enrollment:', cause)
      setError(errorText(cause))
    } finally {
      setMfaBusy(false)
    }
  }

  const verifyMfa = async () => {
    setMfaBusy(true)
    setError('')
    try {
      const challenge = challengeId
        ? { data: { id: challengeId }, error: null }
        : await client.auth.mfa.challenge({ factorId })
      if (challenge.error) throw challenge.error
      const { error: verifyError } = await client.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: mfaCode.trim(),
      })
      if (verifyError) throw verifyError
      setMfaMode('ready')
      setMfaQrCode('')
      setMfaSecret('')
      setMfaCode('')
      setNotice('Multi-factor authentication is enabled for this session.')
    } catch (cause) {
      console.error('MFA verification failed:', cause)
      setError(errorText(cause))
    } finally {
      setMfaBusy(false)
    }
  }

  const signOut = async () => {
    const { error: signOutError } = await client.auth.signOut()
    if (signOutError) {
      setError(signOutError.message)
      return
    }
    navigate('/admin/login', { replace: true })
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-sm text-slate-300">Loading admin panel...</main>
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">AGENTFLOW</p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Admin operations</h1>
          <p className="mt-2 text-sm text-slate-400">Opportunity management, moderation, analytics, and access controls.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void loadDashboard()} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5"><RefreshCw className="h-4 w-4" />Refresh</button>
          <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </header>

      {error ? <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
      {notice ? <div role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</div> : null}

      {requiresPasswordChange ? (
        <section className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5">
          <p className="font-semibold text-amber-100">Change the default admin password before launch.</p>
          <form onSubmit={changePassword} className="mt-4 flex flex-wrap gap-3">
            <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} required placeholder="New password (12+ characters)" className={`${inputClass} max-w-md`} />
            <button type="submit" className="rounded-xl bg-amber-300 px-4 py-2 font-semibold text-slate-950">Change password</button>
          </form>
        </section>
      ) : null}

      {mfaMode !== 'ready' ? (
        <section className="mb-6 rounded-2xl border border-indigo-400/40 bg-indigo-400/10 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-200" />
            <div className="w-full">
              <h2 className="font-semibold text-indigo-100">Protect your admin account with an authenticator</h2>
              <p className="mt-1 text-sm text-slate-300">Set up time-based one-time passwords to secure admin access.</p>
              {mfaMode === 'setup' && !mfaQrCode ? (
                <button type="button" disabled={mfaBusy} onClick={() => void startMfaSetup()} className="mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {mfaBusy ? 'Preparing...' : 'Set up authenticator'}
                </button>
              ) : null}
              {mfaQrCode ? (
                <div className="mt-4 flex flex-wrap items-start gap-4">
                  <img src={mfaQrCode} alt="Authenticator setup QR code" className="h-36 w-36 rounded-lg bg-white p-2" />
                  <div className="max-w-sm text-xs text-slate-300">
                    <p>Scan with your authenticator app, or enter this setup key:</p>
                    <p className="my-2 break-all rounded bg-slate-950 p-2 font-mono">{mfaSecret}</p>
                  </div>
                </div>
              ) : null}
              {mfaMode === 'challenge' ? (
                <p className="mt-3 text-sm text-slate-300">Enter a code from your authenticator to continue.</p>
              ) : null}
              {mfaMode === 'challenge' || mfaQrCode ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} placeholder="6-digit code" className={`${inputClass} max-w-48`} />
                  <button type="button" disabled={mfaBusy || mfaCode.trim().length < 6} onClick={() => void verifyMfa()} className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {mfaBusy ? 'Verifying...' : 'Verify code'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {mfaMode === 'ready' && !requiresPasswordChange ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              ['Published opportunities', summary.published.toLocaleString()],
              ['Pending submissions', summary.pending.toLocaleString()],
              ['Pending scam reports', summary.reports.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Opportunities</h2>
                <p className="mt-1 text-xs text-slate-400">Create, edit, publish, verify, archive, or delete listings.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
                  <FileUp className="h-4 w-4" />Import CSV
                  <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void importCsv(event)} />
                </label>
                <button type="button" onClick={() => setEditor({ ...emptyEditor })} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"><Plus className="h-4 w-4" />New opportunity</button>
              </div>
            </div>
            {editor ? (
              <form onSubmit={(event) => void saveOpportunity(event)} className="mb-5 grid gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-4 md:grid-cols-2">
                <label className={labelClass}>Title<input required value={editor.title} onChange={(event) => setEditor({ ...editor, title: fieldValue(event) })} className={inputClass} /></label>
                <label className={labelClass}>Organization<input required value={editor.organization} onChange={(event) => setEditor({ ...editor, organization: fieldValue(event) })} className={inputClass} /></label>
                <label className={labelClass}>Category<select value={editor.category} onChange={(event) => setEditor({ ...editor, category: fieldValue(event) as Category })} className={inputClass}>{categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}</select></label>
                <label className={labelClass}>Funding<select value={editor.funding_type} onChange={(event) => setEditor({ ...editor, funding_type: fieldValue(event) })} className={inputClass}>{['fully-funded', 'partial', 'paid', 'unpaid'].map((value) => <option key={value}>{value}</option>)}</select></label>
                <label className={labelClass}>Location<input required value={editor.location} onChange={(event) => setEditor({ ...editor, location: fieldValue(event) })} className={inputClass} /></label>
                <label className={labelClass}>Country<input required value={editor.country} onChange={(event) => setEditor({ ...editor, country: fieldValue(event) })} className={inputClass} /></label>
                <label className={labelClass}>Work mode<select value={editor.work_mode} onChange={(event) => setEditor({ ...editor, work_mode: fieldValue(event) })} className={inputClass}>{['remote', 'onsite', 'hybrid'].map((value) => <option key={value}>{value}</option>)}</select></label>
                <label className={labelClass}>Deadline<input type="datetime-local" value={editor.deadline?.slice(0, 16) ?? ''} onChange={(event) => setEditor({ ...editor, deadline: fieldValue(event) })} className={inputClass} /></label>
                <label className={`${labelClass} md:col-span-2`}>Description<textarea required rows={4} value={editor.description} onChange={(event) => setEditor({ ...editor, description: fieldValue(event) })} className={inputClass} /></label>
                <label className={`${labelClass} md:col-span-2`}>Eligibility<textarea rows={3} value={editor.eligibility_text ?? ''} onChange={(event) => setEditor({ ...editor, eligibility_text: fieldValue(event) })} className={inputClass} /></label>
                <label className={labelClass}>Benefits (one per line)<textarea rows={2} value={editor.benefitsText} onChange={(event) => setEditor({ ...editor, benefitsText: fieldValue(event) })} className={inputClass} /></label>
                <label className={labelClass}>Education levels (comma-separated)<input value={editor.educationText} onChange={(event) => setEditor({ ...editor, educationText: fieldValue(event) })} className={inputClass} /></label>
                <label className={labelClass}>Source URL<input type="url" value={editor.source_url ?? ''} onChange={(event) => setEditor({ ...editor, source_url: fieldValue(event) })} className={inputClass} /></label>
                <label className={labelClass}>Application URL<input type="url" value={editor.apply_url ?? ''} onChange={(event) => setEditor({ ...editor, apply_url: fieldValue(event) })} className={inputClass} /></label>
                <label className={labelClass}>Legitimacy score (0-100)<input type="number" min="0" max="100" value={editor.legitimacy_score ?? 0} onChange={(event) => setEditor({ ...editor, legitimacy_score: Number(fieldValue(event)) })} className={inputClass} /></label>
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-300"><input type="checkbox" checked={editor.is_verified} onChange={(event) => setEditor({ ...editor, is_verified: event.target.checked })} />Verified badge</label>
                <div className="flex gap-2 md:col-span-2">
                  <button disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save and publish'}</button>
                  <button type="button" onClick={() => setEditor(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Cancel</button>
                </div>
              </form>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400"><tr><th className="py-2">Opportunity</th><th>Category</th><th>Status</th><th>Deadline</th><th>Verification</th><th /></tr></thead>
                <tbody>{opportunities.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="py-3 pr-3"><p className="font-medium text-white">{item.title}</p><p className="text-xs text-slate-400">{item.organization}</p></td>
                    <td>{categoryLabels[item.category] ?? item.category}</td>
                    <td>{item.status}</td>
                    <td>{formatCompactDate(item.deadline ?? '')}</td>
                    <td><span className={item.is_verified ? 'text-emerald-300' : 'text-slate-400'}>{item.is_verified ? `Verified · ${item.legitimacy_score ?? 0}` : `Unverified · ${item.legitimacy_score ?? 0}`}</span></td>
                    <td className="text-right">
                      <button type="button" onClick={() => setEditor({
                        ...item,
                        benefitsText: (item.benefits ?? []).join('\n'),
                        educationText: (item.education_levels ?? []).join(', '),
                      })} className="mr-3 text-emerald-200 hover:text-emerald-100">Edit</button>
                      <button type="button" aria-label={`Delete ${item.title}`} onClick={() => void deleteOpportunity(item)} className="text-red-300 hover:text-red-200"><Trash2 className="inline h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
              {!opportunities.length ? <p className="py-8 text-center text-sm text-slate-400">No database opportunities yet.</p> : null}
            </div>
            <p className="mt-3 text-xs text-slate-500">CSV columns: title, organization, category, description, eligibility_text, funding_type, location, country, work_mode, deadline, source_url, apply_url, benefits (use |), is_verified, legitimacy_score.</p>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <h2 className="text-xl font-bold text-white">Submission moderation</h2>
              <div className="mt-4 space-y-3">
                {submissions.map((item) => (
                  <article key={item.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-white">{item.title}</h3><span className="text-xs text-amber-200">{item.status}</span></div>
                    <p className="mt-1 text-sm text-slate-400">{item.organization} · {categoryLabels[item.category] ?? item.category}</p>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-300">{item.description}</p>
                    {item.status === 'pending' ? <div className="mt-3 flex gap-2"><button type="button" onClick={() => void reviewSubmission(item, true)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold"><Check className="h-3.5 w-3.5" />Approve & publish</button><button type="button" onClick={() => void reviewSubmission(item, false)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs"><X className="h-3.5 w-3.5" />Reject</button></div> : null}
                  </article>
                ))}
                {!submissions.length ? <p className="text-sm text-slate-400">No user submissions.</p> : null}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <h2 className="text-xl font-bold text-white">Scam reports</h2>
              <div className="mt-4 space-y-3">
                {reports.map((report) => (
                  <article key={report.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-white">{report.opportunity?.title ?? report.opportunity_slug ?? 'Listing no longer available'}</h3><span className="text-xs text-amber-200">{report.status}</span></div>
                    <p className="mt-2 text-sm text-red-200">{report.reason}</p>
                    {report.details ? <p className="mt-1 text-sm text-slate-300">{report.details}</p> : null}
                    {report.status === 'pending' ? <div className="mt-3 flex gap-2"><button type="button" onClick={() => void updateReport(report, 'reviewed')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold">Mark reviewed</button><button type="button" onClick={() => void updateReport(report, 'dismissed')} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs">Dismiss</button></div> : null}
                  </article>
                ))}
                {!reports.length ? <p className="text-sm text-slate-400">No reports received.</p> : null}
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5">
            <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-300" /><h2 className="text-xl font-bold text-white">Analytics by category</h2></div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400"><tr><th className="py-2">Category</th><th>Views</th><th>Saves</th><th>Applications</th></tr></thead>
                <tbody>{analytics.map((row) => <tr key={row.category} className="border-t border-white/10"><td className="py-3">{categoryLabels[row.category as Category] ?? row.category}</td><td>{row.views}</td><td>{row.saves}</td><td>{row.applications}</td></tr>)}</tbody>
              </table>
              {!analytics.length ? <p className="py-5 text-sm text-slate-400">No analytics data recorded yet.</p> : null}
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <h2 className="text-xl font-bold text-white">Admin roles</h2>
              <p className="mt-1 text-sm text-slate-400">Grant admin access using the user UUID. Changes are audit logged.</p>
              <form onSubmit={(event) => { event.preventDefault(); void toggleAdminRole(roleUserId, false) }} className="mt-4 flex flex-wrap gap-2">
                <input value={roleUserId} onChange={(event) => setRoleUserId(event.target.value)} placeholder="User UUID" className={`${inputClass} min-w-64 flex-1`} />
                <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold">Grant admin</button>
              </form>
              <div className="mt-4 space-y-2">
                {roles.map((role) => <div key={role.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/60 px-3 py-2 text-sm"><span className="break-all font-mono text-slate-300">{role.user_id}</span><span className="flex items-center gap-3"><span className={role.role === 'admin' ? 'text-emerald-300' : 'text-slate-400'}>{role.role}</span>{role.role === 'admin' && role.user_id !== userId ? <button type="button" onClick={() => void toggleAdminRole(role.user_id, true)} className="text-red-300 hover:text-red-200">Revoke</button> : null}</span></div>)}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
              <h2 className="text-xl font-bold text-white">Recent admin audit log</h2>
              <div className="mt-4 space-y-2">
                {audit.map((entry) => <div key={entry.id} className="flex justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2 text-sm"><span className="text-slate-200">{entry.action} · {entry.entity}</span><time className="shrink-0 text-xs text-slate-500">{entry.created_at.slice(0, 16).replace('T', ' ')}</time></div>)}
                {!audit.length ? <p className="text-sm text-slate-400">No admin activity recorded.</p> : null}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </main>
  )
}
