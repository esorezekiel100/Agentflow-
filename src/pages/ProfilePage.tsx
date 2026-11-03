import { BriefcaseBusiness, Download, PencilLine, UploadCloud } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { UserProfile } from '../types'
import { loadProfileFromStorage, persistProfile } from '../lib/profile'

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(loadProfileFromStorage())
  const [cvFile, setCvFile] = useState('Ada_CV.pdf')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setProfile(loadProfileFromStorage())
  }, [])

  const updateProfile = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await persistProfile(profile)
    setSaved(true)
    setSaving(false)
  }

  const handleCvUpload = (fileName: string) => {
    setCvFile(fileName)
    setProfile((current) => ({ ...current, cvUrl: fileName }))
  }

  const skillsText = profile.skills.join(', ')
  const interestsText = profile.interests.join(', ')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34725c]">Profile</p>
          <h1 className="mt-2 text-4xl font-black text-[#172234]">Your public profile</h1>
        </div>
        <div className="rounded-full border border-[#b8d5c3] bg-[#e8f2eb] px-3 py-1 text-sm font-semibold text-[#285c43]">
          82% complete
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-400 text-lg font-black text-white">
              {profile.fullName.split(' ').map((item) => item[0]).slice(0, 2).join('').toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile.fullName}</h2>
              <p className="text-sm text-slate-400">{profile.fieldOfStudy}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Location</p>
              <p className="mt-2 font-medium text-white">{profile.city}, {profile.country}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Education</p>
              <p className="mt-2 font-medium text-white">{profile.educationLevel}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">CV upload</p>
              <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-indigo-200">Attached</span>
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-3 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/15">
              <UploadCloud className="h-4 w-4" />
              Upload CV
              <input type="file" hidden onChange={(event) => handleCvUpload(event.target.files?.[0]?.name ?? cvFile)} />
            </label>
            <p className="mt-3 text-xs text-slate-400">Current file: {cvFile}</p>
          </div>
        </aside>

        <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-indigo-200">Edit profile</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Professional details</h2>
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200">
              <PencilLine className="h-4 w-4" />
              Edit
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Full name</span>
              <input value={profile.fullName} onChange={(event) => updateProfile('fullName', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Email</span>
              <input value={profile.email ?? ''} onChange={(event) => updateProfile('email', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Phone</span>
              <input value={profile.phone ?? ''} onChange={(event) => updateProfile('phone', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Country</span>
              <input value={profile.country} onChange={(event) => updateProfile('country', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">City</span>
              <input value={profile.city} onChange={(event) => updateProfile('city', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>

            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Education level</span>
              <select value={profile.educationLevel} onChange={(event) => updateProfile('educationLevel', event.target.value as UserProfile['educationLevel'])} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="secondary">Secondary</option>
                <option value="diploma">Diploma</option>
                <option value="bachelor">Bachelor</option>
                <option value="masters">Masters</option>
                <option value="phd">PhD</option>
              </select>
            </label>

            <label className="block text-sm text-slate-300 md:col-span-2">
              <span className="mb-2 block">Field of study</span>
              <input value={profile.fieldOfStudy} onChange={(event) => updateProfile('fieldOfStudy', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>

            <label className="block text-sm text-slate-300 md:col-span-2">
              <span className="mb-2 block">Skills</span>
              <input value={skillsText} onChange={(event) => updateProfile('skills', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>

            <label className="block text-sm text-slate-300 md:col-span-2">
              <span className="mb-2 block">Interests</span>
              <input value={interestsText} onChange={(event) => updateProfile('interests', event.target.value.split(',').map((item) => item.trim()).filter(Boolean) as UserProfile['interests'])} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>

            <label className="block text-sm text-slate-300 md:col-span-2">
              <span className="mb-2 block">Short bio</span>
              <textarea value={profile.bio ?? ''} onChange={(event) => updateProfile('bio', event.target.value)} rows={4} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>
          </div>

          {saved ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Profile saved successfully.
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70">
              <BriefcaseBusiness className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-indigo-400/40">
              <Download className="h-4 w-4" />
              Download profile
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
