import type { Category, FundingType, UserProfile } from '../types'
import { getSupabaseClient, isSupabaseConfigured, supabase } from './supabase'

export const AGENTFLOW_PROFILE_STORAGE_KEY = 'agentflow-profile-v1'

export const defaultProfile: UserProfile = {
  fullName: 'Ada Okafor',
  email: 'ada.okafor@example.com',
  phone: '+234 803 123 4567',
  country: 'Nigeria',
  city: 'Lagos',
  educationLevel: 'bachelor',
  fieldOfStudy: 'Computer Science',
  skills: ['TypeScript', 'Product strategy', 'Data analysis'],
  interests: ['jobs', 'scholarships', 'graduate-programs'],
  preferences: {
    remote: true,
    funding: ['fully-funded', 'paid'],
    notifications: 'email',
  },
  bio: 'I am a growth-minded student and early-career professional focused on building products and finding opportunities in African tech.',
}

function normalizeInterests(value: unknown): Category[] {
  const safeInput = Array.isArray(value) ? value : []
  const validCategories: Category[] = ['jobs', 'internships', 'graduate-programs', 'scholarships', 'bootcamps', 'grants', 'empowerment']

  return safeInput.filter((item): item is Category => typeof item === 'string' && validCategories.includes(item as Category))
}

function normalizeFunding(value: unknown): FundingType[] {
  const safeInput = Array.isArray(value) ? value : []
  const valid = ['fully-funded', 'partial', 'paid', 'unpaid'] as const

  return safeInput.filter((item): item is FundingType => typeof item === 'string' && valid.includes(item as FundingType))
}

function normalizeProfile(raw: Partial<UserProfile> | null | undefined): UserProfile {
  const next = { ...defaultProfile, ...raw }

  return {
    ...defaultProfile,
    ...next,
    fullName: typeof next.fullName === 'string' ? next.fullName : defaultProfile.fullName,
    country: typeof next.country === 'string' ? next.country : defaultProfile.country,
    city: typeof next.city === 'string' ? next.city : defaultProfile.city,
    educationLevel: ['secondary', 'diploma', 'bachelor', 'masters', 'phd'].includes(next.educationLevel ?? '')
      ? next.educationLevel
      : defaultProfile.educationLevel,
    fieldOfStudy: typeof next.fieldOfStudy === 'string' ? next.fieldOfStudy : defaultProfile.fieldOfStudy,
    skills: Array.isArray(next.skills) ? next.skills.filter((item): item is string => typeof item === 'string') : defaultProfile.skills,
    interests: normalizeInterests(next.interests),
    preferences: {
      remote: Boolean(next.preferences?.remote ?? defaultProfile.preferences.remote),
      funding: normalizeFunding(next.preferences?.funding),
      notifications: next.preferences?.notifications === 'whatsapp' || next.preferences?.notifications === 'telegram' || next.preferences?.notifications === 'email'
        ? next.preferences.notifications
        : defaultProfile.preferences.notifications,
    },
    bio: typeof next.bio === 'string' ? next.bio : defaultProfile.bio,
  }
}

export function loadProfileFromStorage(): UserProfile {
  try {
    const raw = localStorage.getItem(AGENTFLOW_PROFILE_STORAGE_KEY)
    if (!raw) {
      return { ...defaultProfile }
    }

    const parsed = JSON.parse(raw) as Partial<UserProfile>
    return normalizeProfile(parsed)
  } catch {
    return { ...defaultProfile }
  }
}

export function saveProfileToStorage(profile: UserProfile) {
  const normalized = normalizeProfile(profile)
  localStorage.setItem(AGENTFLOW_PROFILE_STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export async function getProfile(): Promise<UserProfile> {
  const localProfile = loadProfileFromStorage()

  if (!supabase || !isSupabaseConfigured) {
    return localProfile
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return localProfile
    }

    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error || !data) {
      return localProfile
    }

    const remoteProfile: UserProfile = {
      ...localProfile,
      fullName: data.full_name ?? localProfile.fullName,
      country: data.country ?? localProfile.country,
      city: data.city ?? localProfile.city,
      educationLevel: data.education_level ?? localProfile.educationLevel,
      fieldOfStudy: data.field_of_study ?? localProfile.fieldOfStudy,
      skills: Array.isArray(data.skills) ? data.skills : localProfile.skills,
      interests: normalizeInterests(data.interests),
      preferences: {
        remote: Boolean(data.preferences?.remote ?? localProfile.preferences.remote),
        funding: normalizeFunding(data.preferences?.funding ?? localProfile.preferences.funding),
        notifications: data.notification_channel ?? localProfile.preferences.notifications,
      },
      cvUrl: data.cv_url ?? localProfile.cvUrl,
    }

    saveProfileToStorage(remoteProfile)
    return remoteProfile
  } catch {
    return localProfile
  }
}

export async function persistProfile(profile: UserProfile) {
  const normalized = saveProfileToStorage(profile)

  if (!supabase || !isSupabaseConfigured) {
    return normalized
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return normalized
    }

    const payload = {
      id: user.id,
      full_name: normalized.fullName,
      country: normalized.country,
      city: normalized.city,
      education_level: normalized.educationLevel,
      field_of_study: normalized.fieldOfStudy,
      skills: normalized.skills,
      interests: normalized.interests,
      preferences: normalized.preferences,
      cv_url: normalized.cvUrl ?? null,
      notification_channel: normalized.preferences.notifications,
      updated_at: new Date().toISOString(),
    }

    await getSupabaseClient().from('profiles').upsert(payload, { onConflict: 'id' })
  } catch {
    // Gracefully fail to local storage when Supabase is unavailable or the schema is not yet active.
  }

  return normalized
}
