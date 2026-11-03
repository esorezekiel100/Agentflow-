import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCountdownParts(deadline: string) {
  const now = new Date()
  const target = new Date(deadline)
  const diffMs = target.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true }
  }

  const totalMinutes = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  return { days, hours, minutes, expired: false }
}

export function formatCompactDate(date: string) {
  if (!date || !Number.isFinite(Date.parse(date))) return 'No deadline listed'
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDeadline(deadline: string) {
  if (!deadline || !Number.isFinite(Date.parse(deadline))) return 'No deadline listed'
  const countdown = getCountdownParts(deadline)

  if (countdown.expired) return 'Expired'

  if (countdown.days > 0) {
    return `${countdown.days}d ${countdown.hours}h left`
  }

  if (countdown.hours > 0) {
    return `${countdown.hours}h ${countdown.minutes}m left`
  }

  return `${countdown.minutes}m left`
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
