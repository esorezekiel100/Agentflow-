import { ArrowRight, Filter, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { OpportunityCard } from '../components/OpportunityCard'
import { categoryLabels } from '../data/opportunities'
import { usePublishedOpportunities } from '../lib/opportunities'
import { usePageMeta } from '../lib/seo'
import type { Category, EducationLevel, FundingType, WorkMode } from '../types'

const categories: Array<{ value: Category | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'internships', label: 'Internships' },
  { value: 'graduate-programs', label: 'Graduate Programs' },
  { value: 'scholarships', label: 'Scholarships' },
  { value: 'bootcamps', label: 'Bootcamps' },
  { value: 'grants', label: 'Grants' },
  { value: 'empowerment', label: 'Empowerment' },
]

const workModes: Array<'all' | WorkMode> = ['all', 'remote', 'onsite', 'hybrid']
const educationLevels: Array<'all' | EducationLevel> = ['all', 'secondary', 'diploma', 'bachelor', 'masters', 'phd']
const fundingTypes: Array<'all' | FundingType> = ['all', 'fully-funded', 'partial', 'paid', 'unpaid']

export function BrowsePage() {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const defaultCategory = slug as Category | undefined
  const searchQuery = (new URLSearchParams(location.search).get('search') ?? '').trim()
  const { opportunities, error: opportunitiesError, loading: opportunitiesLoading } = usePublishedOpportunities()
  const countries = ['all', ...Array.from(new Set(opportunities.map((item) => item.country)))]

  const [category, setCategory] = useState<Category | 'all'>(defaultCategory ?? 'all')
  const [search, setSearch] = useState(searchQuery)
  const [country, setCountry] = useState<string>('all')
  const [workMode, setWorkMode] = useState<'all' | WorkMode>('all')
  const [educationLevel, setEducationLevel] = useState<'all' | EducationLevel>('all')
  const [funding, setFunding] = useState<'all' | FundingType>('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'closing-soon' | 'best-match'>('closing-soon')

  usePageMeta({
    title: category === 'all' ? 'Browse opportunities | AGENTFLOW' : `${categoryLabels[category]} opportunities | AGENTFLOW`,
    description: 'Browse verified jobs, grants, scholarships and training opportunities tailored to your profile and deadlines.',
    path: location.pathname + location.search,
  })

  const filteredOpportunities = useMemo(() => {
    let list = category === 'all'
      ? [...opportunities]
      : opportunities.filter((item) => item.category === category)

    if (search.trim()) {
      const normalized = search.trim().toLowerCase()
      list = list.filter((item) => {
        const searchableText = `${item.title} ${item.organization} ${item.field} ${item.location} ${item.country} ${item.description}`.toLowerCase()
        return searchableText.includes(normalized)
      })
    }

    if (country !== 'all') {
      list = list.filter((item) => item.country === country)
    }

    if (workMode !== 'all') {
      list = list.filter((item) => item.workMode === workMode)
    }

    if (educationLevel !== 'all') {
      list = list.filter((item) => item.educationLevels.includes(educationLevel))
    }

    if (funding !== 'all') {
      list = list.filter((item) => item.fundingType === funding)
    }

    if (verifiedOnly) {
      list = list.filter((item) => item.isVerified)
    }

    if (sortBy === 'newest') {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    if (sortBy === 'closing-soon') {
      list = [...list].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    }

    if (sortBy === 'best-match') {
      list = [...list].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    }

    return list
  }, [category, country, educationLevel, funding, opportunities, search, sortBy, verifiedOnly, workMode])

  const title = category === 'all' ? 'Browse opportunities' : `${categoryLabels[category]} opportunities`

  const resetFilters = () => {
    setCategory(defaultCategory ?? 'all')
    setSearch('')
    setCountry('all')
    setWorkMode('all')
    setEducationLevel('all')
    setFunding('all')
    setVerifiedOnly(false)
    setSortBy('closing-soon')
    navigate(defaultCategory ? `/category/${defaultCategory}` : '/opportunities')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34725c]">Discover</p>
          <h1 className="mt-2 text-4xl font-black text-[#172234]">{title}</h1>
        </div>
        <label className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-300">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            aria-label="Search all opportunities"
            placeholder="Search opportunities"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-slate-950/30">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <SlidersHorizontal className="h-4 w-4 text-indigo-200" />
            Filters
          </div>
          <button type="button" onClick={resetFilters} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-indigo-400/40 hover:text-white">
            Reset
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as Category | 'all')} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {categories.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Country</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {countries.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'All countries' : option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Mode</span>
            <select value={workMode} onChange={(event) => setWorkMode(event.target.value as 'all' | WorkMode)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {workModes.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'Any mode' : option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Education</span>
            <select value={educationLevel} onChange={(event) => setEducationLevel(event.target.value as 'all' | EducationLevel)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {educationLevels.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'Any level' : option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Funding</span>
            <select value={funding} onChange={(event) => setFunding(event.target.value as 'all' | FundingType)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {fundingTypes.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'Any funding' : option}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'newest' | 'closing-soon' | 'best-match')} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="newest">Newest</option>
              <option value="closing-soon">Closing soon</option>
              <option value="best-match">Best match</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-2">
            <input type="checkbox" checked={verifiedOnly} onChange={() => setVerifiedOnly((value) => !value)} className="h-4 w-4 rounded border-slate-500 bg-slate-950 text-indigo-500" />
            Verified only
          </label>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 text-sm text-[#526172]">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e1e5e0] bg-white px-3 py-2">
          <Filter className="h-4 w-4 text-[#34725c]" />
          <span>{filteredOpportunities.length} results</span>
        </div>
        <div className="inline-flex items-center gap-2 text-[#526172]">
          <ShieldCheck className="h-4 w-4 text-[#34725c]" />
          <span>AI legitimacy checks enabled</span>
        </div>
      </div>

      {filteredOpportunities.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-[#cbd5ce] bg-white p-12 text-center">
          {opportunitiesError ? <p role="alert" className="text-sm text-red-700">Could not load opportunities: {opportunitiesError}</p> : null}
          {!opportunitiesError && opportunitiesLoading ? <p className="text-sm text-[#526172]">Loading opportunities...</p> : null}
          {!opportunitiesError && !opportunitiesLoading ? <>
          <p className="text-xl font-semibold text-[#172234]">No opportunities match your filters</p>
          <p className="mt-2 text-[#647080]">Try widening the country or funding filters to uncover more opportunities.</p>
          </> : null}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center justify-center">
        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[#cbdccf] bg-[#edf4ee] px-5 py-3 text-sm font-semibold text-[#285c43] transition hover:bg-[#e2eee4]">
          Load more <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
