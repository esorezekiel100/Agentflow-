import { ArrowRight, Bookmark, CheckCircle2, Clock3, MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryLabels } from '../data/opportunities'
import { formatDeadline, formatCompactDate } from '../lib/utils'
import type { Opportunity } from '../types'

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const deadlineLabel = formatDeadline(opportunity.deadline)

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-[#e4e8e4] bg-white p-5 shadow-[0_8px_24px_-20px_rgba(27,42,58,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-[#a9c1b1] hover:shadow-[0_18px_36px_-24px_rgba(27,72,52,0.3)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <span className="rounded-full bg-[#edf3ee] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#426e55]">
          {categoryLabels[opportunity.category]}
        </span>
        <button
          type="button"
          className="rounded-full border border-[#e6e9e5] bg-[#fbfcfa] p-2 text-[#687584] transition hover:border-[#a9c1b1] hover:text-[#315e4b]"
          aria-label={`Save ${opportunity.title}`}
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-[#388363]">
          {opportunity.isVerified ? <ShieldCheck className="h-3.5 w-3.5" /> : null}
          <span>{opportunity.isVerified ? 'Verified listing' : 'Unverified listing'}</span>
        </div>

        <Link to={`/opportunity/${opportunity.slug}`} className="block">
          <h3 className="text-xl font-semibold leading-tight text-[#1d2c37] transition group-hover:text-[#315e4b]">
            {opportunity.title}
          </h3>
        </Link>

        <p className="text-sm text-[#697683]">{opportunity.organization}</p>

        <div className="flex flex-wrap gap-3 text-xs text-[#65717d]">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {opportunity.location}</span>
          <span className="rounded-full bg-[#fbf2e4] px-2 py-1 text-[#986527]">{opportunity.fundingType}</span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-[#74808b]">{opportunity.description}</p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#e8ebe7] pt-4">
        <div className="flex items-center gap-2 text-xs text-[#647080]">
          <Clock3 className="h-3.5 w-3.5 text-[#b6813d]" />
          <span className={deadlineLabel.includes('Expired') ? 'text-red-600' : 'text-[#9a6a2d]'}>{deadlineLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#34725c]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>{opportunity.matchScore ?? 88}% match</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-[#77828d]">
        <span>{formatCompactDate(opportunity.deadline)}</span>
        <Link
          to={`/opportunity/${opportunity.slug}`}
          className="inline-flex items-center gap-1 font-semibold text-[#315e4b] transition hover:text-[#193d2e]"
        >
          View details <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  )
}
