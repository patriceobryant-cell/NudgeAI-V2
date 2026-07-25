/**
 * Browser notifications. NudgeAI has no server, so notifications are delivered
 * while a tab is open: a lightweight scheduler polls for reminders whose date and
 * time have arrived and fires one notification per reminder, deduplicated across
 * reloads so a user is never nagged twice for the same nudge.
 */
import { useEffect, useRef } from 'react'
import { dueReminders } from './selectors'
import { formatTime, todayISO } from './dates'

const SENT_KEY = 'nudgeai.notified'
const CHECK_INTERVAL_MS = 30_000

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export const permissionState = () => (notificationsSupported() ? Notification.permission : 'unsupported')

/** Prompts for permission. Resolves to the resulting permission string. */
export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

function readSent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SENT_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeSent(map) {
  try {
    // Only keep the last 200 entries so the record cannot grow without bound.
    const entries = Object.entries(map).slice(-200)
    localStorage.setItem(SENT_KEY, JSON.stringify(Object.fromEntries(entries)))
  } catch {
    /* ignore */
  }
}

function show(title, body, tag) {
  try {
    const notification = new Notification(title, {
      body,
      tag,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
    })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    return true
  } catch {
    return false
  }
}

/** Fires a one-off notification so a user can confirm the setup works. */
export function sendTestNotification() {
  if (permissionState() !== 'granted') return false
  return show('NudgeAI is watching your nudges', 'This is what a reminder will look like.', `test-${Date.now()}`)
}

/**
 * Keeps an eye on open reminders and notifies as each becomes due.
 * Rechecks on an interval and whenever the tab regains focus, which covers the
 * case of a laptop waking from sleep.
 */
export function useReminderNotifications({ enabled, reminders, people }) {
  const latest = useRef({ reminders, people })
  latest.current = { reminders, people }

  useEffect(() => {
    if (!enabled || permissionState() !== 'granted') return undefined

    const check = () => {
      const sent = readSent()
      const due = dueReminders(latest.current.reminders)
      let changed = false

      due.forEach((reminder) => {
        // The date is part of the key so a repeating reminder notifies each cycle.
        const key = `${reminder.id}@${reminder.date}`
        if (sent[key]) return
        const person = latest.current.people.find((p) => p.id === reminder.personId)
        const who = person ? `for ${person.name}` : 'from your list'
        const delivered = show(
          reminder.title,
          `A gentle nudge ${who} · ${formatTime(reminder.time)}`,
          key,
        )
        if (delivered) {
          sent[key] = todayISO()
          changed = true
        }
      })

      if (changed) writeSent(sent)
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, reminders, people])
}
