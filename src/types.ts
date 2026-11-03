export type Category =
  | 'jobs'
  | 'internships'
  | 'graduate-programs'
  | 'scholarships'
  | 'bootcamps'
  | 'grants'
  | 'empowerment'

export type FundingType = 'fully-funded' | 'partial' | 'paid' | 'unpaid'
export type WorkMode = 'remote' | 'onsite' | 'hybrid'
export type EducationLevel = 'secondary' | 'diploma' | 'bachelor' | 'masters' | 'phd'

export interface Opportunity {
  id: string
  slug: string
  title: string
  organization: string
  category: Category
  field: string
  description: string
  eligibilityText: string
  benefits: string[]
  howToApply: string
  fundingType: FundingType
  location: string
  country: string
  workMode: WorkMode
  educationLevels: EducationLevel[]
  applyUrl: string
  sourceUrl: string
  deadline: string
  status: 'published' | 'draft' | 'archived'
  isVerified: boolean
  legitimacyScore: number
  legitimacyReasons: string[]
  createdAt: string
  matchScore?: number
}

export interface UserProfile {
  fullName: string
  email?: string
  phone?: string
  country: string
  city: string
  educationLevel: EducationLevel
  fieldOfStudy: string
  skills: string[]
  interests: Category[]
  preferences: {
    remote: boolean
    funding: FundingType[]
    notifications: 'email' | 'whatsapp' | 'telegram'
  }
  cvUrl?: string
  bio?: string
}
