/**
 * Date helpers. Dates are stored as plain `YYYY-MM-DD` strings and times as
 * `HH:MM`, so everything is parsed at local noon to stay clear of timezone
 * boundaries when only the calendar day matters.
 */

export const todayISO = () => toISO(new Date())

export function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parses `YYYY-MM-DD` into a local Date at noon. Returns null for empty input. */
export function parseISO(iso) {
  if (!iso || typeof iso !== 'string') return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

/** Combines a stored date and time into a local Date used for due comparisons. */
export function parseDateTime(iso, time = '09:00') {
  const date = parseISO(iso)
  if (!date) return null
  const [h, min] = String(time || '09:00').split(':').map(Number)
  date.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(min) ? min : 0, 0, 0)
  return date
}

/** Whole days from today to an ISO date. Negative means it already passed. */
export function daysFromToday(iso) {
  const date = parseISO(iso)
  if (!date) return null
  const start = new Date()
  start.setHours(12, 0, 0, 0)
  return Math.round((date - start) / 86400000)
}

/** Days elapsed since an ISO date, or null when it was never recorded. */
export function daysSince(iso) {
  const days = daysFromToday(iso)
  return days === null ? null : -days
}

/**
 * Days until the next occurrence of a recurring calendar date such as a
 * birthday, ignoring the stored year. Returns 0 when it lands today.
 */
export function daysUntilNextAnnual(iso) {
  const date = parseISO(iso)
  if (!date) return null
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  const next = new Date(now.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
  if (next < now) next.setFullYear(now.getFullYear() + 1)
  return Math.round((next - now) / 86400000)
}

/** The age or number of years a date will reach on its next anniversary. */
export function upcomingYears(iso) {
  const date = parseISO(iso)
  if (!date) return null
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  let year = now.getFullYear()
  const thisYear = new Date(year, date.getMonth(), date.getDate(), 12, 0, 0, 0)
  if (thisYear < now) year += 1
  const years = year - date.getFullYear()
  return years > 0 && years < 150 ? years : null
}

export function formatDate(iso, opts = {}) {
  const date = parseISO(iso)
  if (!date) return 'Not set'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', ...opts })
}

/** `Mar 24` — used where the year would just be noise. */
export function formatDayMonth(iso) {
  const date = parseISO(iso)
  if (!date) return 'Not set'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatTime(time) {
  const date = parseDateTime(todayISO(), time)
  if (!date) return ''
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** Human phrasing for how far off a date is: "Today", "in 3 days", "2 days ago". */
export function relativeDay(iso) {
  const days = daysFromToday(iso)
  if (days === null) return ''
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 1 && days < 7) return parseISO(iso).toLocaleDateString(undefined, { weekday: 'long' })
  if (days > 0) return `in ${days} days`
  return `${Math.abs(days)} days ago`
}

/** Compact countdown for badges: "Today", "3d", "2mo". */
export function countdownLabel(days) {
  if (days === null || days === undefined) return '—'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}y`
}

/** "3 days ago" / "Never" for last-contact copy. */
export function sinceLabel(iso) {
  const days = daysSince(iso)
  if (days === null) return 'No moments logged yet'
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 31) return `${days} days ago`
  if (days < 365) return `${Math.round(days / 30)} months ago`
  return `${Math.round(days / 365)} years ago`
}

/** Advances an ISO date by a repeat rule, used when a repeating reminder is completed. */
export function advanceDate(iso, repeat) {
  const date = parseISO(iso)
  if (!date) return iso
  switch (repeat) {
    case 'Daily':
      date.setDate(date.getDate() + 1)
      break
    case 'Weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'Every two weeks':
      date.setDate(date.getDate() + 14)
      break
    case 'Monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'Yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
    default:
      return iso
  }
  // A long-untouched repeating reminder should land in the future, not the past.
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  let guard = 0
  while (date < now && guard < 500) {
    guard += 1
    if (repeat === 'Daily') date.setDate(date.getDate() + 1)
    else if (repeat === 'Weekly') date.setDate(date.getDate() + 7)
    else if (repeat === 'Every two weeks') date.setDate(date.getDate() + 14)
    else if (repeat === 'Monthly') date.setMonth(date.getMonth() + 1)
    else if (repeat === 'Yearly') date.setFullYear(date.getFullYear() + 1)
    else break
  }
  return toISO(date)
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function longDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}
