import { ArrowUpRight, Bot, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { runAgentAction } from '../lib/agent'

const sampleQueries = [
  'Find me fully funded master\'s scholarships in Europe closing in the next 30 days',
  'Show me remote jobs in product design for Africa-based candidates',
  'List verified internships in climate policy for graduates',
]

export function AgentPage() {
  const [query, setQuery] = useState(sampleQueries[0])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Array<Record<string, unknown>>>([])
  const [message, setMessage] = useState('')

  const handleSearch = async () => {
    setLoading(true)
    const result = await runAgentAction('match-opportunities', { query })
    setResults((result.items as Array<Record<string, unknown>>) ?? [])
    setMessage(result.message || 'AI response generated.')
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34725c]">AGENTFLOW agent</p>
          <h1 className="mt-2 text-4xl font-black text-[#172234]">Ask for opportunities</h1>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-100">
          AI grounded in real listings
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
          <Bot className="h-5 w-5 text-indigo-200" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask the AGENTFLOW agent"
            className="w-full bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button type="button" onClick={handleSearch} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70">
            <Search className="h-4 w-4" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {sampleQueries.map((item) => (
            <button key={item} type="button" onClick={() => setQuery(item)} className="rounded-full border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 transition hover:border-indigo-400/40">
              {item}
            </button>
          ))}
        </div>
      </div>

      {results.length ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {results.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-200">{String(item.category ?? 'Opportunity')}</span>
                <span className="text-sm font-semibold text-indigo-200">{String(item.match_score ?? 90)}%</span>
              </div>
              <h2 className="text-xl font-semibold text-white">{String(item.title ?? 'Opportunity')}</h2>
              <p className="mt-2 text-sm text-slate-400">{String(item.organization ?? 'Organization')}</p>
              <p className="mt-3 text-sm text-slate-300">{String(item.reason ?? 'Matched to your profile and interests.')}</p>
              <button type="button" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-200 hover:text-indigo-100">
                View listing <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-8 rounded-3xl border border-indigo-400/20 bg-gradient-to-r from-indigo-500/10 to-slate-900 p-6">
        <div className="flex items-center gap-3 text-indigo-200">
          <Sparkles className="h-5 w-5" />
          <p className="font-semibold">AI note</p>
        </div>
        <p className="mt-4 text-slate-200">
          {message || 'The results are grounded in the live database and include a legitimacy check before any match is surfaced.'}
        </p>
      </div>
    </div>
  )
}
