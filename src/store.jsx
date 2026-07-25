/**
 * Application state. Everything NudgeAI knows lives in a single object that is
 * mirrored into localStorage on every change, so the app is fully usable offline
 * and nothing leaves the device.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SEED_PEOPLE, SEED_REMINDERS } from './data'
import { advanceDate, todayISO, toISO } from './lib/dates'

const STORAGE_KEY = 'nudgeai.v3'
const SCHEMA_VERSION = 3

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const emptyState = () => ({
  version: SCHEMA_VERSION,
  profile: { name: 'Friend' },
  settings: { theme: 'system', notifications: false, digestTime: '09:00', showSeedData: true },
  people: [],
  reminders: [],
  moments: [],
  savedIdeas: [],
})

const seededState = () => ({
  ...emptyState(),
  profile: { name: 'Alex' },
  people: SEED_PEOPLE,
  reminders: SEED_REMINDERS,
})

/** Normalises a person record so older or imported data always has every field. */
function normalisePerson(person = {}) {
  return {
    id: person.id || uid(),
    name: String(person.name || '').trim() || 'Someone',
    relationship: person.relationship || 'Friend',
    birthday: person.birthday || '',
    anniversary: person.anniversary || '',
    favorites: person.favorites || '',
    notes: person.notes || '',
    loveLanguage: person.loveLanguage || 'Quality time',
    // v2 stored this as `frequency`.
    cadence: person.cadence || person.frequency || 'Monthly',
    accent: person.accent || person.color || 'teal',
    lastConnected: person.lastConnected || '',
    createdAt: person.createdAt || todayISO(),
  }
}

function normaliseReminder(reminder = {}) {
  return {
    id: reminder.id || uid(),
    personId: reminder.personId || '',
    title: String(reminder.title || '').trim() || 'Reach out',
    date: reminder.date || todayISO(),
    time: reminder.time || '09:00',
    repeat: reminder.repeat || 'Never',
    notes: reminder.notes || '',
    done: Boolean(reminder.done),
    completedAt: reminder.completedAt || '',
    createdAt: reminder.createdAt || todayISO(),
  }
}

function normaliseMoment(moment = {}) {
  return {
    id: moment.id || uid(),
    personId: moment.personId || '',
    kind: moment.kind || 'Other',
    note: moment.note || '',
    date: moment.date || todayISO(),
  }
}

/** Merges any stored or imported payload onto the current schema. */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null
  const base = emptyState()
  const people = Array.isArray(raw.people) ? raw.people.map(normalisePerson) : []
  const known = new Set(people.map((p) => p.id))
  return {
    version: SCHEMA_VERSION,
    profile: {
      ...base.profile,
      // v2 kept the name at the top level as `firstName`.
      name: String(raw.profile?.name || raw.firstName || base.profile.name).slice(0, 40),
    },
    settings: {
      ...base.settings,
      ...(raw.settings || {}),
      // v2 stored a boolean `dark` flag instead of a theme choice.
      theme: raw.settings?.theme || (raw.dark ? 'dark' : base.settings.theme),
      notifications: Boolean(raw.settings?.notifications ?? raw.notifications),
    },
    people,
    reminders: (Array.isArray(raw.reminders) ? raw.reminders.map(normaliseReminder) : []).map((r) => ({
      ...r,
      personId: known.has(r.personId) ? r.personId : '',
    })),
    moments: (Array.isArray(raw.moments) ? raw.moments.map(normaliseMoment) : []).filter((m) => known.has(m.personId)),
    savedIdeas: Array.isArray(raw.savedIdeas) ? raw.savedIdeas.filter((x) => typeof x === 'string') : [],
  }
}

function readStorage() {
  if (typeof localStorage === 'undefined') return seededState()
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('nudgeai-v2-data')
    if (!stored) return seededState()
    return migrate(JSON.parse(stored)) ?? seededState()
  } catch {
    return seededState()
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(readStorage)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const undoRef = useRef(null)

  // Persist on every change. A quota failure should never break the UI.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full or unavailable — the session keeps working in memory */
    }
  }, [state])

  const notify = useCallback((message, action) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ id: uid(), message, action })
    toastTimer.current = setTimeout(() => setToast(null), action ? 7000 : 3200)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(null)
  }, [])

  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), [])

  /** Snapshots state so a destructive action can offer a single-step undo. */
  const withUndo = useCallback(
    (message) => {
      undoRef.current = state
      notify(message, {
        label: 'Undo',
        run: () => {
          if (undoRef.current) setState(undoRef.current)
          undoRef.current = null
        },
      })
    },
    [notify, state],
  )

  const actions = useMemo(() => {
    const patch = (fn) => setState((prev) => ({ ...prev, ...fn(prev) }))

    return {
      savePerson(input) {
        const person = normalisePerson(input)
        let created = false
        patch((prev) => {
          const exists = prev.people.some((p) => p.id === person.id)
          created = !exists
          return {
            people: exists ? prev.people.map((p) => (p.id === person.id ? { ...p, ...person } : p)) : [...prev.people, person],
          }
        })
        notify(created ? `${person.name} added to your circle` : `${person.name} updated`)
        return person
      },

      deletePerson(id) {
        const person = state.people.find((p) => p.id === id)
        withUndo(`${person?.name || 'Person'} removed`)
        patch((prev) => ({
          people: prev.people.filter((p) => p.id !== id),
          reminders: prev.reminders.filter((r) => r.personId !== id),
          moments: prev.moments.filter((m) => m.personId !== id),
        }))
      },

      /** Records a touchpoint and moves the person's last-contact date forward. */
      logMoment(input) {
        const moment = normaliseMoment(input)
        patch((prev) => ({
          moments: [moment, ...prev.moments],
          people: prev.people.map((p) =>
            p.id === moment.personId && (!p.lastConnected || p.lastConnected <= moment.date)
              ? { ...p, lastConnected: moment.date }
              : p,
          ),
        }))
        const name = state.people.find((p) => p.id === moment.personId)?.name
        notify(name ? `Moment logged with ${name}` : 'Moment logged')
      },

      deleteMoment(id) {
        patch((prev) => ({ moments: prev.moments.filter((m) => m.id !== id) }))
        notify('Moment removed')
      },

      saveReminder(input) {
        const reminder = normaliseReminder(input)
        let created = false
        patch((prev) => {
          const exists = prev.reminders.some((r) => r.id === reminder.id)
          created = !exists
          return {
            reminders: exists
              ? prev.reminders.map((r) => (r.id === reminder.id ? { ...r, ...reminder } : r))
              : [...prev.reminders, reminder],
          }
        })
        notify(created ? 'Reminder scheduled' : 'Reminder updated')
        return reminder
      },

      /**
       * Completing a repeating reminder rolls it to its next occurrence instead of
       * archiving it, which is what people expect from a recurring nudge.
       */
      toggleReminder(id) {
        let message = ''
        patch((prev) => ({
          reminders: prev.reminders.map((r) => {
            if (r.id !== id) return r
            if (r.done) {
              message = 'Moved back to upcoming'
              return { ...r, done: false, completedAt: '' }
            }
            if (r.repeat !== 'Never') {
              message = 'Done — rescheduled for the next round'
              return { ...r, date: advanceDate(r.date, r.repeat), done: false, completedAt: todayISO() }
            }
            message = 'Nudge complete'
            return { ...r, done: true, completedAt: todayISO() }
          }),
        }))
        if (message) notify(message)
      },

      snoozeReminder(id, days = 1) {
        patch((prev) => ({
          reminders: prev.reminders.map((r) => {
            if (r.id !== id) return r
            const next = new Date()
            next.setHours(12, 0, 0, 0)
            next.setDate(next.getDate() + days)
            return { ...r, date: toISO(next), done: false }
          }),
        }))
        notify(days === 1 ? 'Snoozed until tomorrow' : `Snoozed for ${days} days`)
      },

      deleteReminder(id) {
        withUndo('Reminder deleted')
        patch((prev) => ({ reminders: prev.reminders.filter((r) => r.id !== id) }))
      },

      clearCompleted() {
        const count = state.reminders.filter((r) => r.done).length
        if (!count) return
        withUndo(`Cleared ${count} completed nudge${count === 1 ? '' : 's'}`)
        patch((prev) => ({ reminders: prev.reminders.filter((r) => !r.done) }))
      },

      toggleSavedIdea(text) {
        let saved = false
        patch((prev) => {
          saved = !prev.savedIdeas.includes(text)
          return {
            savedIdeas: saved ? [text, ...prev.savedIdeas] : prev.savedIdeas.filter((x) => x !== text),
          }
        })
        notify(saved ? 'Idea saved' : 'Idea removed from saved')
      },

      setProfileName(name) {
        patch((prev) => ({ profile: { ...prev.profile, name: name.slice(0, 40) } }))
      },

      updateSettings(changes) {
        patch((prev) => ({ settings: { ...prev.settings, ...changes } }))
      },

      replaceAll(payload) {
        const next = migrate(payload)
        if (!next) throw new Error('Unrecognised backup file')
        undoRef.current = state
        setState(next)
        notify(`Restored ${next.people.length} people and ${next.reminders.length} reminders`, {
          label: 'Undo',
          run: () => undoRef.current && setState(undoRef.current),
        })
      },

      loadSampleData() {
        undoRef.current = state
        setState(seededState())
        notify('Sample circle loaded', { label: 'Undo', run: () => undoRef.current && setState(undoRef.current) })
      },

      resetAll() {
        undoRef.current = state
        setState(emptyState())
        notify('Everything cleared', { label: 'Undo', run: () => undoRef.current && setState(undoRef.current) })
      },

      notify,
    }
  }, [notify, state, withUndo])

  const value = useMemo(() => ({ state, actions, toast, dismissToast }), [state, actions, toast, dismissToast])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

export { STORAGE_KEY }
