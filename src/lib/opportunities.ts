import { useEffect, useState } from 'react'
import { categoryLabels, opportunitySeed } from '../data/opportunities'
import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import type { Category, EducationLevel, FundingType, Opportunity, WorkMode } from '../types'

type DatabaseOpportunity = {
  id: string
  slug: string
  title: string
  organization: string
  category: string
  description: string
  eligibility_text: string | null
  benefits: string[] | null
  funding_type: string
  location: string
  country: string
  work_mode: string
  education_levels: string[] | null
  apply_url: string | null
  source_url: string | null
  deadline: string | null
  status: Opportunity['status']
  is_verified: boolean
  legitimacy_score: number | null
  legitimacy_reasons: string[] | null
  created_at: string
}

const educationLevels: EducationLevel[] = ['secondary', 'diploma', 'bachelor', 'masters', 'phd']
const fundingTypes: FundingType[] = ['fully-funded', 'partial', 'paid', 'unpaid']
const workModes: WorkMode[] = ['remote', 'onsite', 'hybrid']

function mapDatabaseOpportunity(row: DatabaseOpportunity): Opportunity | null {
  if (!Object.hasOwn(categoryLabels, row.category)) return null

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    organization: row.organization,
    category: row.category as Category,
    field: '',
    description: row.description,
    eligibilityText: row.eligibility_text ?? '',
    benefits: row.benefits ?? [],
    howToApply: 'Review the official source and application instructions before applying.',
    fundingType: fundingTypes.includes(row.funding_type as FundingType) ? row.funding_type as FundingType : 'paid',
    location: row.location,
    country: row.country,
    workMode: workModes.includes(row.work_mode as WorkMode) ? row.work_mode as WorkMode : 'remote',
    educationLevels: (row.education_levels ?? []).filter((level): level is EducationLevel => educationLevels.includes(level as EducationLevel)),
    applyUrl: row.apply_url ?? '',
    sourceUrl: row.source_url ?? '',
    deadline: row.deadline ?? '',
    status: row.status,
    isVerified: row.is_verified,
    legitimacyScore: row.legitimacy_score ?? 0,
    legitimacyReasons: row.legitimacy_reasons ?? [],
    createdAt: row.created_at,
  }
}

export function usePublishedOpportunities() {
  const [state, setState] = useState({
    opportunities: isSupabaseConfigured ? [] as Opportunity[] : opportunitySeed,
    error: '',
    loading: isSupabaseConfigured,
  })

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true

    const load = async () => {
      try {
        const { data, error } = await getSupabaseClient()
          .from('opportunities')
          .select('id, slug, title, organization, category, description, eligibility_text, benefits, funding_type, location, country, work_mode, education_levels, apply_url, source_url, deadline, status, is_verified, legitimacy_score, legitimacy_reasons, created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
        if (error) throw error

        const fromDatabase = ((data ?? []) as DatabaseOpportunity[])
          .map(mapDatabaseOpportunity)
          .filter((item): item is Opportunity => item !== null)
        const databaseSlugs = new Set(fromDatabase.map((item) => item.slug))
        if (active) {
          setState({
            opportunities: [...fromDatabase, ...opportunitySeed.filter((item) => !databaseSlugs.has(item.slug))],
            error: '',
            loading: false,
          })
        }
      } catch (error) {
        console.error('Unable to load published opportunities from Supabase:', error)
        if (active) {
          setState({
            opportunities: [],
            error: error instanceof Error ? error.message : 'Unable to load opportunities.',
            loading: false,
          })
        }
      }
    }

    void load()
    return () => { active = false }
  }, [])

  return state
}
