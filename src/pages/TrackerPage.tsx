import { CheckCircle2, FileText, FolderOpen, PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

type TrackerStage = 'Saved' | 'Preparing' | 'Applied' | 'Interview/Shortlisted' | 'Offer/Awarded' | 'Rejected'

type TrackerItem = {
  id: string
  title: string
  stage: TrackerStage
  deadline: string
  checklist: string[]
}

const stageOrder: TrackerStage[] = ['Saved', 'Preparing', 'Applied', 'Interview/Shortlisted', 'Offer/Awarded', 'Rejected']
const trackerStorageKey = 'agentflow-tracker-v1'

const defaultTrackerItems: TrackerItem[] = [
  { id: 'opportunity-1', title: 'AI Operations Coordinator', stage: 'Saved', deadline: '2026-12-20T23:59:00Z', checklist: ['CV', 'Statement of interest'] },
  { id: 'opportunity-2', title: 'Women in Tech Scholarship', stage: 'Saved', deadline: '2026-12-18T23:59:00Z', checklist: ['Transcript', 'Essay'] },
  { id: 'opportunity-3', title: 'Software Engineer', stage: 'Preparing', deadline: '2026-12-26T18:00:00Z', checklist: ['Portfolio', 'Cover letter'] },
  { id: 'opportunity-4', title: 'Climate Fellowship', stage: 'Preparing', deadline: '2026-12-21T17:00:00Z', checklist: ['Essay', 'Reference'] },
  { id: 'opportunity-5', title: 'Graduate Analytics Accelerator', stage: 'Applied', deadline: '2026-12-15T21:00:00Z', checklist: ['Application form', 'CV'] },
  { id: 'opportunity-6', title: 'Product Designer', stage: 'Interview/Shortlisted', deadline: '2026-12-30T12:00:00Z', checklist: ['Portfolio', 'Availability note'] },
  { id: 'opportunity-7', title: 'Climate Innovation Fellowship', stage: 'Offer/Awarded', deadline: '2026-12-28T10:00:00Z', checklist: ['Acceptance letter'] },
]

function formatDeadline(deadline: string) {
  const date = new Date(deadline)
  const diffDays = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000))

  if (diffDays === 0) return 'Due today'
  return `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`
}

export function TrackerPage() {
  const [items, setItems] = useState<TrackerItem[]>(() => {
    const stored = localStorage.getItem(trackerStorageKey)
    if (!stored) return defaultTrackerItems

    try {
      const parsed = JSON.parse(stored) as TrackerItem[]
      return parsed.length ? parsed : defaultTrackerItems
    } catch {
      return defaultTrackerItems
    }
  })
  const [draggedId, setDraggedId] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(trackerStorageKey, JSON.stringify(items))
  }, [items])

  const groupedStages = stageOrder.map((stage) => ({
    stage,
    items: items.filter((item) => item.stage === stage),
  }))

  const handleDrop = (stage: TrackerStage) => {
    if (!draggedId) return

    setItems((current) => current.map((item) => item.id === draggedId ? { ...item, stage } : item))
    setDraggedId(null)
  }

  const handleAddOpportunity = () => {
    const nextId = `opportunity-${Date.now()}`
    setItems((current) => [
      {
        id: nextId,
        title: 'AI for Communities Bootcamp',
        stage: 'Saved',
        deadline: '2026-12-19T18:00:00Z',
        checklist: ['Interest form', 'CV'],
      },
      ...current,
    ])
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#34725c]">Tracker</p>
          <h1 className="mt-2 text-4xl font-black text-[#172234]">Your application pipeline</h1>
        </div>
        <button type="button" onClick={handleAddOpportunity} className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400">
          <PlusCircle className="h-4 w-4" />
          Add opportunity
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-6">
        {groupedStages.map(({ stage, items: stageItems }) => (
          <div key={stage} onDragOver={(event) => event.preventDefault()} onDrop={() => handleDrop(stage)} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">{stage}</h2>
              <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">{stageItems.length}</span>
            </div>
            <div className="space-y-3">
              {stageItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggedId(item.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 shadow-sm shadow-slate-950/30"
                >
                  <p className="font-medium text-slate-100">{item.title}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatDeadline(item.deadline)}</span>
                    <div className="flex items-center gap-2 text-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {item.checklist.length} items
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.checklist.slice(0, 2).map((checkItem) => (
                      <span key={checkItem} className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-200">{checkItem}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <div className="flex items-center gap-3 text-indigo-200"><FileText className="h-5 w-5" /> Documents</div>
          <p className="mt-4 text-sm text-slate-300">CV, transcript, cover letter and recommendation checklist are ready.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <div className="flex items-center gap-3 text-emerald-200"><CheckCircle2 className="h-5 w-5" /> Progress</div>
          <p className="mt-4 text-sm text-slate-300">{items.filter((item) => item.stage === 'Applied' || item.stage === 'Interview/Shortlisted' || item.stage === 'Offer/Awarded').length} opportunities are in active motion and {items.filter((item) => item.stage === 'Saved').length} are saved for later.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
          <div className="flex items-center gap-3 text-amber-200"><FolderOpen className="h-5 w-5" /> Reminders</div>
          <p className="mt-4 text-sm text-slate-300">Deadline notifications are scheduled for the next three days across your active opportunities.</p>
        </div>
      </div>
    </div>
  )
}
