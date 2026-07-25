/**
 * Derived views over the stored data. Keeping these pure and in one place means
 * the dashboard, People page and notification scheduler all agree on what
 * "overdue", "due today" and "upcoming" mean.
 */
import { CADENCE_DAYS, DEFAULT_SUGGESTION, IDEA_BANK } from '../data'
import { daysFromToday, daysSince, daysUntilNextAnnual, parseDateTime, toISO } from './dates'

export const personById = (people, id) => people.find((p) => p.id === id) || null

/** Reminders that are not done, soonest first. */export function openReminders(reminders) {
  return reminders
    .filter((r) => !r.done)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
}

export function completedReminders(reminders) {
  return reminders
    .filter((r) => r.done)
    .sort((a, b) => (b.completedAt || b.date).localeCompare(a.completedAt || a.date))
}

/** A reminder whose date has passed and is not today. */
export const isOverdue = (reminder) => !reminder.done && daysFromToday(reminder.date) < 0

export const isToday = (reminder) => daysFromToday(reminder.date) === 0

/** Reminders whose date and time have arrived — the trigger for notifications. */
export function dueReminders(reminders, now = new Date()) {
  return openReminders(reminders).filter((r) => {
    const at = parseDateTime(r.date, r.time)
    return at && at <= now
  })
}

/**
 * People who have gone longer than their chosen cadence without a logged moment.
 * Sorted by how far past due they are, so the most neglected surface first.
 */
export function overduePeople(people) {
  return people
    .map((person) => {
      const cadence = CADENCE_DAYS[person.cadence] ?? 30
      const since = daysSince(person.lastConnected)
      const elapsed = since === null ? cadence + 1 : since
      return { person, cadence, since, overdueBy: elapsed - cadence }
    })
    .filter((entry) => entry.overdueBy > 0)
    .sort((a, b) => b.overdueBy - a.overdueBy)
}

/** Birthdays and anniversaries within the next `withinDays` days. */
export function upcomingDates(people, withinDays = 60) {
  return people
    .flatMap((person) =>
      [
        ['Birthday', person.birthday],
        ['Anniversary', person.anniversary],
      ]
        .filter(([, iso]) => Boolean(iso))
        .map(([kind, iso]) => ({
          key: `${person.id}-${kind}`,
          person,
          kind,
          date: iso,
          days: daysUntilNextAnnual(iso),
        })),
    )
    .filter((entry) => entry.days !== null && entry.days <= withinDays)
    .sort((a, b) => a.days - b.days)
}

/** Ideas tailored to a person's relationship, falling back to universal ones. */
export function ideasForPerson(person, category = null) {
  const pool = category ? IDEA_BANK.filter((idea) => idea.category === category) : IDEA_BANK
  if (!person) return pool
  const tailored = pool.filter((idea) => idea.fits.length === 0 || idea.fits.includes(person.relationship))
  return tailored.length ? tailored : pool
}

/**
 * The single suggestion shown on the dashboard hero. Rotates daily so the same
 * person does not get the same prompt two days running.
 */
export function suggestionFor(person, salt = 0) {
  if (!person) return DEFAULT_SUGGESTION
  const options = ideasForPerson(person)
  if (!options.length) return DEFAULT_SUGGESTION
  const dayIndex = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000)
  const seed = dayIndex + salt + person.id.length
  return options[Math.abs(seed) % options.length].text
}

/**
 * Who most needs attention today: the most overdue person, otherwise whoever
 * has a celebration coming up, otherwise the first person in the circle.
 */
export function focusPerson(people) {
  const overdue = overduePeople(people)
  if (overdue.length) return overdue[0].person
  const soon = upcomingDates(people, 14)
  if (soon.length) return soon[0].person
  return people[0] || null
}

/**
 * A 0–100 "intentionality" score. It blends how many people are on cadence with
 * recent follow-through on reminders, so it moves when behaviour changes rather
 * than just when data is added.
 */
export function connectionScore(state) {
  const { people, reminders, moments } = state
  if (!people.length) return 0

  const onCadence = people.length - overduePeople(people).length
  const cadenceScore = (onCadence / people.length) * 60

  const recentWindow = 30
  const recentMoments = moments.filter((m) => {
    const since = daysSince(m.date)
    return since !== null && since <= recentWindow
  }).length
  const momentScore = Math.min(recentMoments / Math.max(people.length, 1), 1) * 20

  const open = reminders.filter((r) => !r.done)
  const overdueCount = open.filter(isOverdue).length
  const followThrough = open.length ? 1 - Math.min(overdueCount / open.length, 1) : 1
  const reminderScore = followThrough * 20

  return Math.max(0, Math.min(100, Math.round(cadenceScore + momentScore + reminderScore)))
}

export function scoreLabel(score) {
  if (score >= 85) return 'Thriving'
  if (score >= 65) return 'Steady'
  if (score >= 40) return 'Needs attention'
  return 'Time to reconnect'
}

/** Moments logged in the current calendar week, used for the weekly stat. */
export function momentsThisWeek(moments) {
  const start = new Date()
  start.setHours(12, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)) // week starts Monday
  const startISO = toISO(start)
  return moments.filter((m) => m.date >= startISO).length
}

/** Consecutive days, counting back from today, with at least one logged moment. */
export function momentStreak(moments) {
  if (!moments.length) return 0
  const days = new Set(moments.map((m) => m.date))
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  let streak = 0
  // Today not being logged yet should not break yesterday's streak.
  if (!days.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 1)
  for (let i = 0; i < 400; i += 1) {
    if (!days.has(toISO(cursor))) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
