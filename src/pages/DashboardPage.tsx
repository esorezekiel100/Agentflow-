import { CalendarDays, Bell, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { loadProfileFromStorage } from '../lib/profile'
import { opportunitySeed } from '../data/opportunities'

const trackerStorageKey = 'agentflow-tracker-v1'

function getTrackerItems() {
  const stored = localStorage.getItem(trackerStorageKey)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function DashboardPage() {
  const profile = loadProfileFromStorage()

  const trackingItems = useMemo(() => getTrackerItems(), [])
  const profileCompletion = useMemo(() => {
    const checks = [
      profile.fullName,
      profile.country,
      profile.city,
      profile.fieldOfStudy,
      profile.skills.length,
      profile.interests.length,
      profile.preferences.remote,
      profile.preferences.notifications,
    ]

    const filled = checks.filter(Boolean).length
    return Math.min(100, Math.round((filled / 8) * 100))
  }, [profile])

  const upcomingDeadlines = useMemo(() => {
    const items = trackingItems
      .map((item: { title: string; deadline: string }) => ({
        title: item.title,
        deadline: item.deadline,
        date: new Date(item.deadline).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
      }))
      .filter((item) => new Date(item.deadline).getTime() > Date.now())
      .slice(0, 4)

    return items
  }, [trackingItems])

  const topMatches = useMemo(() => {
    return [...opportunitySeed]
      .filter((item) => item.matchScore)
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
      .slice(0, 3)
  }, [])

  const notifications = [
    'New fully funded scholarship match added.',
    'Deadline reminder scheduled for tomorrow.',
    'Your profile was reviewed for AI matching.',
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34725c]">Dashboard</p>
        <h1 className="mt-2 text-4xl font-black text-[#172234]">Your opportunity overview</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <p className="text-sm text-slate-400">Profile completion</p>
          <p className="mt-3 text-4xl font-black text-white">{profileCompletion}%</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <p className="text-sm text-slate-400">Top matches</p>
          <p className="mt-3 text-4xl font-black text-white">{topMatches.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <p className="text-sm text-slate-400">Upcoming deadlines</p>
          <p className="mt-3 text-4xl font-black text-white">{upcomingDeadlines.length}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <div className="mb-5 flex items-center gap-3 text-white">
            <CalendarDays className="h-5 w-5 text-indigo-200" />
            <h2 className="text-xl font-bold">Upcoming deadlines</h2>
          </div>
          <div className="space-y-3">
            {upcomingDeadlines.length ? (
              upcomingDeadlines.map((deadline) => (
                <div key={deadline.title} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
                  <span>{deadline.title}</span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-200">{deadline.date}</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 px-4 py-4 text-sm text-slate-300">
                No tracked opportunities with upcoming deadlines yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3 text-white">
            <Bell className="h-5 w-5 text-emerald-200" />
            <h2 className="text-xl font-bold">Notifications</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            {notifications.map((notification) => (
              <div key={notification} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">{notification}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3 text-indigo-200"><TrendingUp className="h-5 w-5" /> <h2 className="text-xl font-bold text-white">Top matches</h2></div>
          <ul className="mt-5 space-y-3 text-sm text-slate-300">
            {topMatches.map((item) => (
              <li key={item.slug} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                {item.title} — {item.matchScore ?? 0}%
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3 text-emerald-200"><Sparkles className="h-5 w-5" /> <h2 className="text-xl font-bold text-white">AI suggestions</h2></div>
          <ul className="mt-5 space-y-3 text-sm text-slate-300">
            <li className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">Tailor your CV for the product designer role.</li>
            <li className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">Add one leadership example to strengthen scholarship applications.</li>
            <li className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">Set reminders for the climate fellowship and scholarship deadlines.</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-200" />
        <p className="mt-3 text-xl font-bold text-white">You're ahead of the cycle.</p>
        <p className="mt-2 text-sm text-emerald-100">Your saved opportunities currently align with {topMatches.length} high-probability matches.</p>
      </div>
    </div>
  )
}
