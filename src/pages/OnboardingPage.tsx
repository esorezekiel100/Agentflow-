import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { loadProfileFromStorage, persistProfile } from '../lib/profile'

const educationLevels = ['secondary', 'diploma', 'bachelor', 'masters', 'phd'] as const
const interestOptions = ['jobs', 'internships', 'graduate-programs', 'scholarships', 'bootcamps', 'grants', 'empowerment'] as const
const fundingOptions = ['fully-funded', 'partial', 'paid', 'unpaid'] as const
const notificationChannels = ['email', 'whatsapp', 'telegram'] as const

const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Add your full name'),
  country: z.string().min(2, 'Select your country'),
  city: z.string().min(2, 'Tell us your city'),
  educationLevel: z.enum(educationLevels),
  fieldOfStudy: z.string().min(2, 'Mention your field'),
  skills: z.array(z.string()).min(1, 'Add at least one skill'),
  interests: z.array(z.enum(interestOptions)).min(1, 'Choose at least one interest'),
  remote: z.boolean(),
  funding: z.array(z.enum(fundingOptions)).min(1, 'Pick your preferred funding types'),
  notificationChannel: z.enum(notificationChannels),
})

type FormState = z.infer<typeof onboardingSchema>

const initialState: FormState = {
  fullName: '',
  country: 'Nigeria',
  city: '',
  educationLevel: 'bachelor',
  fieldOfStudy: '',
  skills: ['Communication', 'Research'],
  interests: ['jobs', 'scholarships'],
  remote: true,
  funding: ['fully-funded', 'paid'],
  notificationChannel: 'email',
}

const steps = [
  'Profile basics',
  'Education & field',
  'Skills & experience',
  'Interests',
  'Preferences',
]

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'submit', string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const existing = loadProfileFromStorage()
    setForm({
      fullName: existing.fullName ?? initialState.fullName,
      country: existing.country || initialState.country,
      city: existing.city || initialState.city,
      educationLevel: existing.educationLevel || initialState.educationLevel,
      fieldOfStudy: existing.fieldOfStudy || initialState.fieldOfStudy,
      skills: existing.skills.length ? existing.skills : initialState.skills,
      interests: existing.interests.length ? existing.interests : initialState.interests,
      remote: existing.preferences.remote,
      funding: existing.preferences.funding.length ? existing.preferences.funding : initialState.funding,
      notificationChannel: existing.preferences.notifications || initialState.notificationChannel,
    })
  }, [])

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step])

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const toggleValue = (key: 'skills' | 'interests' | 'funding', value: string) => {
    const list = form[key] as string[]
    const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
    updateField(key, next as FormState[typeof key])
  }

  const stepValid = () => {
    const attempted = { ...form }
    const result = onboardingSchema.safeParse(attempted)
    if (!result.success) {
      const fieldErrors = Object.fromEntries(
        Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0]]),
      )
      setErrors({ ...fieldErrors, submit: 'Please complete the required fields before continuing.' })
      return false
    }

    setErrors({})
    return true
  }

  const nextStep = () => {
    if (step === 0) {
      if (!stepValid()) return
    }
    if (step < steps.length - 1) {
      setStep((current) => current + 1)
    }
  }

  const previousStep = () => {
    if (step > 0) setStep((current) => current - 1)
  }

  const submit = async () => {
    if (!stepValid()) return

    setIsSaving(true)
    setErrors({})
    setSuccessMessage('')

    const profile = {
      ...loadProfileFromStorage(),
      fullName: form.fullName,
      country: form.country,
      city: form.city,
      educationLevel: form.educationLevel,
      fieldOfStudy: form.fieldOfStudy,
      skills: form.skills,
      interests: form.interests as FormState['interests'],
      preferences: {
        remote: form.remote,
        funding: form.funding as FormState['funding'],
        notifications: form.notificationChannel,
      },
      bio: loadProfileFromStorage().bio,
    }

    await persistProfile(profile)
    setSuccessMessage('Profile ready. You can continue to your dashboard and opportunities.')
    setIsSaving(false)
    navigate('/dashboard')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-indigo-200">Get started</p>
            <h1 className="mt-2 text-3xl font-black text-white">Complete your profile</h1>
          </div>
          <div className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-100">
            Step {step + 1} of {steps.length}
          </div>
        </div>

        <div className="mb-8 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                index === step ? 'bg-indigo-500 text-white' : index < step ? 'bg-emerald-500/15 text-emerald-200' : 'border border-white/10 bg-slate-950 text-slate-400'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {step === 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm text-slate-300 md:col-span-2">
              <span className="mb-2 block">Full name</span>
              <input
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Ada Okafor"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Country</span>
              <input
                value={form.country}
                onChange={(event) => updateField('country', event.target.value)}
                placeholder="Nigeria"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">City</span>
              <input
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="Lagos"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Education level</span>
              <select
                value={form.educationLevel}
                onChange={(event) => updateField('educationLevel', event.target.value as FormState['educationLevel'])}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {educationLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Field of study</span>
              <input
                value={form.fieldOfStudy}
                onChange={(event) => updateField('fieldOfStudy', event.target.value)}
                placeholder="Computer Science"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Skills</span>
              <input
                value={form.skills.join(', ')}
                onChange={(event) => updateField('skills', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
                placeholder="TypeScript, UX research, Data analysis"
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="mb-3 text-sm font-medium text-slate-200">Popular skills</p>
              <div className="flex flex-wrap gap-2">
                {['TypeScript', 'Product management', 'Research', 'Data analysis', 'Design', 'Writing', 'Public speaking', 'Project management'].map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleValue('skills', skill)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      form.skills.includes(skill) ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-slate-900 text-slate-300'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <p className="text-sm text-slate-300">Select the categories you care about most.</p>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleValue('interests', option)}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                    form.interests.includes(option) ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-slate-950 text-slate-300'
                  }`}
                >
                  {option.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-5">
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              <span>Open to remote opportunities</span>
              <input type="checkbox" checked={form.remote} onChange={(event) => updateField('remote', event.target.checked)} className="h-4 w-4 rounded border-slate-500 bg-slate-950 text-indigo-500" />
            </label>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="mb-3 text-sm font-medium text-slate-200">Preferred funding</p>
              <div className="flex flex-wrap gap-2">
                {fundingOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleValue('funding', option)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      form.funding.includes(option) ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-slate-900 text-slate-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Notification channel</span>
              <select
                value={form.notificationChannel}
                onChange={(event) => updateField('notificationChannel', event.target.value as FormState['notificationChannel'])}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {notificationChannels.map((channel) => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {errors.submit ? (
          <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${errors.submit.includes('ready') ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-amber-400/30 bg-amber-500/10 text-amber-100'}`}>
            {errors.submit}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button type="button" onClick={previousStep} disabled={step === 0} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-300 disabled:cursor-not-allowed disabled:opacity-50">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {step < steps.length - 1 ? (
            <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400">
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70">
              <CheckCircle2 className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
