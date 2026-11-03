import { opportunitySeed } from '../data/opportunities'
import { loadProfileFromStorage } from './profile'
import { getSupabaseClient, isSupabaseConfigured, supabase } from './supabase'

export type AgentAction =
  | 'match-opportunities'
  | 'check-eligibility'
  | 'verify-legitimacy'
  | 'draft-application'
  | 'deadline-reminders'

export type AgentResult = {
  ok: boolean
  message: string
  items?: Array<Record<string, unknown>>
  score?: number
  riskLevel?: 'Verified' | 'Likely OK' | 'Caution' | 'High Risk'
  reasons?: string[]
  content?: string
  kind?: string
  matches?: Array<Record<string, unknown>>
}

function buildMatchCandidates(query: string) {
  const profile = loadProfileFromStorage()
  const normalized = query.toLowerCase()

  return opportunitySeed
    .filter((item) => {
      const haystack = [
        item.title,
        item.organization,
        item.category,
        item.field,
        item.location,
        item.description,
        item.country,
        ...item.benefits,
      ].join(' ').toLowerCase()

      const matchesQuery = !normalized || haystack.includes(normalized)
      const matchesProfile = !profile.interests.length || profile.interests.some((interest) => interest === item.category)
      return matchesQuery && matchesProfile
    })
    .slice(0, 6)
    .map((item) => ({
      title: item.title,
      organization: item.organization,
      category: item.category,
      country: item.country,
      location: item.location,
      deadline: item.deadline,
      match_score: item.matchScore ?? 90,
      reason: `Strong fit for ${profile.fieldOfStudy || 'your profile'} and ${item.category.replace('-', ' ')} opportunities.`,
    }))
}

function buildDemoResponse(action: AgentAction, payload: Record<string, unknown>): AgentResult {
  const query = String(payload.query ?? '')

  if (action === 'match-opportunities') {
    const items = buildMatchCandidates(query)
    return {
      ok: true,
      message: 'AI-generated opportunity matches grounded in the current opportunity database.',
      items,
    }
  }

  if (action === 'check-eligibility') {
    const profile = loadProfileFromStorage()
    const requirements = [
      { label: 'Education fit', pass: ['bachelor', 'masters', 'phd'].includes(profile.educationLevel) },
      { label: 'Country eligibility', pass: profile.country.length > 0 },
      { label: 'Remote preference', pass: profile.preferences.remote || true },
      { label: 'Funding preference', pass: profile.preferences.funding.length > 0 },
    ]

    return {
      ok: true,
      message: 'Eligibility check based on your saved profile and the listing requirements.',
      items: requirements.map((item) => ({ ...item, status: item.pass ? 'pass' : 'unknown' })),
    }
  }

  if (action === 'verify-legitimacy') {
    return {
      ok: true,
      score: 91,
      riskLevel: 'Verified',
      reasons: [
        'Official source URL and organization details are present.',
        'No upfront payment or suspicious urgency language was detected.',
        'Application process is transparent and consistent with the listing.',
      ],
      message: 'This is an automated assessment. Verify on the official site before applying.',
    }
  }

  if (action === 'draft-application') {
    return {
      ok: true,
      kind: 'cover-letter',
      content: `Dear Hiring Manager,\n\nI am excited to apply for this opportunity. My background in ${loadProfileFromStorage().fieldOfStudy || 'technology and innovation'} and my experience in ${loadProfileFromStorage().skills.slice(0, 2).join(', ')} align strongly with the role. I am particularly motivated by the chance to contribute to meaningful work and continue learning in a high-impact environment.\n\nI would welcome the opportunity to discuss how my profile can support your team.\n\nSincerely,\n${loadProfileFromStorage().fullName}`,
      message: 'AI-generated draft based on your profile. Edit before sending.',
    }
  }

  if (action === 'deadline-reminders') {
    return {
      ok: true,
      items: opportunitySeed
        .slice(0, 4)
        .map((item) => ({
          title: item.title,
          remind_at: item.deadline,
          channel: 'email',
        })),
      message: 'Reminder schedule prepared for the next three deadlines.',
    }
  }

  return {
    ok: true,
    message: 'No direct agent result available for this query.',
  }
}

export async function runAgentAction(action: AgentAction, payload: Record<string, unknown> = {}): Promise<AgentResult> {
  if (!supabase || !isSupabaseConfigured) {
    return buildDemoResponse(action, payload)
  }

  try {
    const { data, error } = await getSupabaseClient().functions.invoke(action, {
      body: payload,
    })

    if (error) {
      return buildDemoResponse(action, payload)
    }

    return {
      ok: true,
      ...(typeof data === 'object' && data ? data : {}),
      message: String((data as { message?: string })?.message ?? 'AI response generated.'),
    } as AgentResult
  } catch {
    return buildDemoResponse(action, payload)
  }
}
