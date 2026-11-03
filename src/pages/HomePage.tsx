import { ArrowRight, ChevronRight, Clock3, Mail, MapPin, Search, ShieldCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OpportunityCard } from '../components/OpportunityCard'
import { categoryLabels, closingSoon, opportunitySeed } from '../data/opportunities'
import { usePageMeta } from '../lib/seo'
import { formatCompactDate, formatDeadline } from '../lib/utils'
import type { Category } from '../types'

const categories: Category[] = ['jobs', 'internships', 'graduate-programs', 'scholarships', 'bootcamps', 'grants', 'empowerment']

const categoryVisuals: Record<Category, { image: string; caption: string; fallback: string }> = {
  jobs: {
    image: 'photo-1521737711867-e3b97375f902',
    caption: 'Build your next chapter',
    fallback: 'linear-gradient(115deg, #17362d, #416a53)',
  },
  internships: {
    image: 'photo-1523240795612-9a054b0db644',
    caption: 'Start with real experience',
    fallback: 'linear-gradient(115deg, #243a4b, #5c7e83)',
  },
  'graduate-programs': {
    image: 'photo-1523050854058-8df90110c9f1',
    caption: 'Launch your career',
    fallback: 'linear-gradient(115deg, #463a33, #9b8060)',
  },
  scholarships: {
    image: 'photo-1498243691581-b145c3f54a5a',
    caption: 'Make your education possible',
    fallback: 'linear-gradient(115deg, #263d4b, #66879a)',
  },
  bootcamps: {
    image: 'photo-1516321318423-f06f85e504b3',
    caption: 'Learn skills that move you',
    fallback: 'linear-gradient(115deg, #29394b, #596e8c)',
  },
  grants: {
    image: 'photo-1454165804606-c3d57bc86b40',
    caption: 'Turn ideas into impact',
    fallback: 'linear-gradient(115deg, #344639, #778866)',
  },
  empowerment: {
    image: 'photo-1551836022-d5d88e9218df',
    caption: 'Grow with your community',
    fallback: 'linear-gradient(115deg, #493932, #99735d)',
  },
}

const stats = [
  { label: 'Opportunities listed', value: '1.2k+' },
  { label: 'Verified listings', value: '94%' },
  { label: 'Deadlines tracked', value: '3.8k' },
]

const sections = categories.map((category) => ({
  category,
  items: opportunitySeed.filter((item) => item.category === category).slice(0, 3),
}))

const imageUrl = (id: string, width: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`

export function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  usePageMeta({
    title: 'AGENTFLOW | Find it. Verify it. Apply to it.',
    description: 'Discover verified jobs, internships, scholarships, grants, and training programs across Africa and beyond with AGENTFLOW.',
    path: '/',
  })

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(`/opportunities${trimmed ? `?search=${encodeURIComponent(trimmed)}` : ''}`)
  }

  return (
    <div className="bg-[#f7f6f2] text-[#182334]">
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
          <div className="py-3">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d9e3dc] bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#34725c] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#39a47a]" />
              Opportunities, thoughtfully discovered
            </p>
            <h1 className="max-w-2xl font-serif text-5xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#172234] sm:text-6xl lg:text-[4.25rem]">
              Find your next <span className="text-[#34725c]">possibility.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#647080]">
              A clearer way to discover trusted jobs, scholarships, training and grants—then stay one step ahead of every deadline.
            </p>

            <form onSubmit={handleSearch} className="mt-8 flex flex-col gap-2 rounded-2xl border border-[#e1e4df] bg-white p-2 shadow-[0_12px_35px_-24px_rgba(27,42,58,0.3)] sm:flex-row">
              <label className="flex min-h-12 flex-1 items-center gap-3 px-3 text-[#7b8490]">
                <Search className="h-5 w-5 shrink-0 text-[#658372]" />
                <input
                  aria-label="Search opportunities"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search opportunities, skills or locations"
                  className="w-full bg-transparent text-sm text-[#182334] placeholder:text-[#929aa3] focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1f493b] px-6 text-sm font-semibold text-white transition hover:bg-[#173c30]"
              >
                Explore opportunities <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/category/${category}`}
                  className="rounded-full border border-[#e0e4df] bg-white/80 px-3.5 py-2 text-sm font-medium text-[#526172] transition hover:border-[#9bb7a7] hover:bg-white hover:text-[#1f493b]"
                >
                  {categoryLabels[category]}
                </Link>
              ))}
            </div>
            <div className="mt-7 flex items-center gap-2 text-sm text-[#687584]">
              <ShieldCheck className="h-4 w-4 text-[#388363]" />
              Listings reviewed for legitimacy and clear application details
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#203b36,#557562)] shadow-[0_28px_70px_-38px_rgba(20,40,32,0.6)] sm:min-h-[500px]">
            <img
              src={imageUrl('photo-1521737711867-e3b97375f902', 1400)}
              alt="A diverse team collaborating around a table"
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101d1c]/85 via-[#172b29]/15 to-[#172b29]/5" />
            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/35 bg-white/90 px-3.5 py-2 text-xs font-semibold text-[#29483c] shadow-lg backdrop-blur sm:left-7 sm:top-7">
              <ShieldCheck className="h-4 w-4 text-[#388363]" />
              A more considered search
            </div>
            <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
              <div className="max-w-md text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Make the next move yours</p>
                <p className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">Good opportunities deserve a better way to find them.</p>
              </div>
              <div className="mt-6 grid max-w-lg grid-cols-3 gap-2 rounded-2xl border border-white/20 bg-white/90 p-3 text-[#1d2c37] shadow-xl backdrop-blur-md sm:gap-4 sm:p-4">
                <div>
                  <p className="text-lg font-bold sm:text-xl">30+</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-[#687584] sm:text-xs">curated listings</p>
                </div>
                <div className="border-x border-[#e5e8e4] px-3 sm:px-4">
                  <p className="text-lg font-bold sm:text-xl">7</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-[#687584] sm:text-xs">opportunity types</p>
                </div>
                <div>
                  <p className="text-lg font-bold sm:text-xl">One</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-[#687584] sm:text-xs">clear next step</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7e8e3] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#334155]">
            <Clock3 className="h-4 w-4 text-[#bc7b32]" />
            Closing soon
          </div>
          <div className="flex min-w-0 gap-3 overflow-x-auto py-1">
            {closingSoon.map((opportunity) => (
              <Link
                key={opportunity.id}
                to={`/opportunity/${opportunity.slug}`}
                className="flex shrink-0 items-center gap-3 rounded-xl border border-[#eee2d0] bg-[#fcf8f1] px-3.5 py-2 text-xs text-[#694c2b] transition hover:border-[#d7b986]"
              >
                <span className="max-w-48 truncate font-medium">{opportunity.title}</span>
                <span className="whitespace-nowrap text-[#a36624]">{formatDeadline(opportunity.deadline)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#54806b]">A good place to begin</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#172234]">Explore opportunities</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#707b87]">Find the right path, whether you are starting out, changing direction, or ready to take your next big step.</p>
        </div>

        {sections.map(({ category, items }) => {
          const visual = categoryVisuals[category]
          return (
            <div key={category} className="mb-16">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#63816f]">{categoryLabels[category]}</p>
                  <h3 className="mt-1 font-serif text-2xl font-semibold text-[#1b2938]">{visual.caption}</h3>
                </div>
                <Link to={`/category/${category}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#dce3dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#315e4b] transition hover:border-[#9bb7a7] hover:bg-[#f4f8f4]">
                  See all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <Link to={`/category/${category}`} style={{ background: visual.fallback }} className="group relative mb-5 block h-40 overflow-hidden rounded-2xl sm:h-48">
                <img
                  src={imageUrl(visual.image, 1200)}
                  alt={`${categoryLabels[category]} opportunity`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#101d1c]/75 via-[#101d1c]/25 to-transparent" />
                <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center px-6 text-white sm:px-9">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">{categoryLabels[category]}</span>
                  <span className="mt-2 font-serif text-2xl font-medium sm:text-3xl">{visual.caption}</span>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-white/90">Discover what is possible <ArrowRight className="h-4 w-4" /></span>
                </div>
              </Link>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {items.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            </div>
          )
        })}
      </section>

      <section className="border-y border-[#e5e6e1] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#54806b]">Recommended for you</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em] text-[#172234]">A stronger match starts with your profile</h2>
            </div>
            <Link to="/onboarding" className="inline-flex items-center gap-2 text-sm font-semibold text-[#315e4b] hover:text-[#193d2e]">
              Build your profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {opportunitySeed.slice(0, 3).map((opportunity) => (
              <div key={opportunity.id} className="rounded-2xl border border-[#e6e9e5] bg-[#fbfcfa] p-5 transition hover:border-[#bbcec0] hover:shadow-lg hover:shadow-[#203b36]/5">
                <div className="flex items-center justify-between gap-2 text-sm text-[#647080]">
                  <span className="rounded-full bg-[#e8f2eb] px-2.5 py-1 text-xs font-semibold text-[#34725c]">{opportunity.matchScore ?? 90}% match</span>
                  <span>{opportunity.country}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#1d2c37]">{opportunity.title}</h3>
                <p className="mt-1 text-sm text-[#74808b]">{opportunity.organization}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-[#647080]">
                  <MapPin className="h-3.5 w-3.5 text-[#6a8a76]" />
                  <span>{opportunity.location}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#e8ebe7] pt-4 text-xs text-[#77828d]">
                  <span>Deadline {formatCompactDate(opportunity.deadline)}</span>
                  <Link to={`/opportunity/${opportunity.slug}`} className="font-semibold text-[#315e4b]">View details</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-3xl border border-[#e4e6e1] bg-[#eeefe9] p-5 sm:grid-cols-3 sm:p-7">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white px-5 py-6 text-center shadow-sm shadow-[#203b36]/5">
              <p className="font-serif text-3xl font-semibold text-[#1f493b]">{stat.value}</p>
              <p className="mt-2 text-sm text-[#71808a]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-3 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#203b36] p-7 text-white sm:p-10 lg:p-12">
          <img
            src={imageUrl('photo-1521737711867-e3b97375f902', 1400)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#152b25]/95 via-[#1d3a31]/85 to-[#24483a]/65" />
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b8d5c3]">Never miss a deadline</p>
              <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">The right opportunity, at the right time.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">Get weekly opportunity digests, WhatsApp alerts and deadline reminders delivered to your inbox.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link to="/auth" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1f493b] transition hover:bg-[#eff5f0]">
                Get deadline alerts <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex items-center justify-center gap-2 text-xs text-white/75">
                <Mail className="h-4 w-4 text-[#b8d5c3]" />
                <span>Newsletter · WhatsApp · Telegram</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e5e6e1] bg-white py-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#54806b]">Verified & trusted</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-[#172234]">Opportunity checks you can rely on</h2>
          </div>
          <ShieldCheck className="h-8 w-8 shrink-0 text-[#43876a]" />
        </div>
      </section>
    </div>
  )
}
