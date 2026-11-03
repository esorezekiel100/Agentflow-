import { BarChart3, FileText, SearchCheck, ShieldAlert, Upload, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { opportunitySeed } from '../data/opportunities'
import { usePageMeta } from '../lib/seo'

const adminMetrics = [
  { label: 'Opportunities', value: '1,284', icon: BarChart3 },
  { label: 'Verified', value: '94%', icon: SearchCheck },
  { label: 'Reports', value: '23', icon: ShieldAlert },
  { label: 'New users', value: '1,040', icon: Users },
]

const moderationQueue = [
  { title: 'Climate Startup Fellowship', organization: 'GreenWorks Africa', status: 'Pending review', reason: 'Source URL missing' },
  { title: 'Women in AI Bootcamp', organization: 'SheBuild Labs', status: 'Needs fact-check', reason: 'Deadline mismatch detected' },
  { title: 'Youth Agritech Grant', organization: 'FieldGrow Initiative', status: 'Approved', reason: 'Verified source and terms reviewed' },
]

const reportQueue = [
  { title: 'Remote UX Research Program', reason: 'Requests payment before selection', user: 'Ada O.' },
  { title: 'African Climate Fellowship', reason: 'Offers vague company details', user: 'David B.' },
  { title: 'Digital Skills Accelerator', reason: 'Unclear source URL and urgency language', user: 'Zainab M.' },
]

const categoryViews = [
  { label: 'Jobs', value: 38 },
  { label: 'Scholarships', value: 29 },
  { label: 'Internships', value: 18 },
  { label: 'Bootcamps', value: 15 },
]

export function AdminPage() {
  usePageMeta({
    title: 'Admin dashboard | AGENTFLOW',
    description: 'Moderate listings, review scam reports, track performance, and manage opportunity publishing in AGENTFLOW admin.',
    path: '/admin',
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34725c]">Admin</p>
          <h1 className="mt-2 text-4xl font-black text-[#172234]">Moderation and operations</h1>
        </div>
        <Link to="/submit-opportunity" className="inline-flex items-center gap-2 rounded-full border border-[#cbdccf] bg-[#edf4ee] px-4 py-2 text-sm font-semibold text-[#285c43] hover:bg-[#e2eee4]">
          <FileText className="h-4 w-4" />
          Submit opportunity
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{label}</p>
              <Icon className="h-5 w-5 text-indigo-200" />
            </div>
            <p className="mt-4 text-3xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-white">Opportunity pipeline</h2>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-400/40">
              <Upload className="h-3.5 w-3.5" />
              Bulk import CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {opportunitySeed.slice(0, 5).map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="py-3 pr-4 font-medium text-white">{item.title}</td>
                    <td className="py-3 pr-4">{item.category}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{new Date(item.deadline).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-xl font-bold text-white">Content insights</h2>
          <div className="mt-5 space-y-4">
            {categoryViews.map((entry) => (
              <div key={entry.label}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{entry.label}</span>
                  <span>{entry.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" style={{ width: `${entry.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-xl font-bold text-white">Moderation queue</h2>
          <div className="mt-5 space-y-3">
            {moderationQueue.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{item.title}</p>
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-200">{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{item.organization}</p>
                <p className="mt-2 text-sm text-slate-300">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-xl font-bold text-white">Reported listings</h2>
          <div className="mt-5 space-y-3">
            {reportQueue.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-red-200">{item.reason}</p>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-slate-400">
                  <span>Submitted by {item.user}</span>
                  <button type="button" className="text-indigo-200 hover:text-indigo-100">Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
