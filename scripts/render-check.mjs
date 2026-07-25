/**
 * Render smoke test (dev-only, not part of the app bundle).
 * Renders every page and dialog through react-dom/server with minimal browser
 * shims so runtime errors in the render path surface without a browser.
 */
import { renderToString } from 'react-dom/server'
import { createElement as h } from 'react'

// ---- browser shims -------------------------------------------------------
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
}
globalThis.sessionStorage = globalThis.localStorage

const listeners = []
globalThis.window = globalThis
globalThis.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
globalThis.window.addEventListener = (...a) => listeners.push(a)
globalThis.window.removeEventListener = () => {}
globalThis.window.location = { hash: '#/dashboard', replace(v) { this.hash = v } }
globalThis.document = {
  documentElement: { dataset: {} },
  addEventListener() {},
  removeEventListener() {},
  querySelector: () => null,
  createElement: () => ({ click() {}, remove() {}, style: {} }),
  body: { style: {}, appendChild() {} },
  activeElement: null,
  visibilityState: 'visible',
}
globalThis.Notification = { permission: 'default' }
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { clipboard: { writeText: async () => {} } },
})
globalThis.Blob = class { constructor(parts) { this.size = String(parts?.[0] ?? '').length } }

// ---- modules under test --------------------------------------------------
const { default: App } = await import('../src/App.jsx')
const { StoreProvider } = await import('../src/store.jsx')
const { PersonForm, ReminderForm, MomentForm } = await import('../src/components/forms.jsx')
const { PersonDetail } = await import('../src/components/PersonDetail.jsx')
const { ConfirmDialog, Modal, Toast, EmptyState, ScoreDial, StatCard } = await import('../src/components/ui.jsx')
const { SEED_PEOPLE, SEED_REMINDERS } = await import('../src/data.js')
const dates = await import('../src/lib/dates.js')
const selectors = await import('../src/lib/selectors.js')

const results = []
const check = (name, fn) => {
  try {
    const output = fn()
    // A render that produced no markup at all is a failure, not a pass.
    if (typeof output === 'string' && output.length === 0) throw new Error('rendered nothing')
    results.push(['PASS', name])
  } catch (error) {
    results.push(['FAIL', `${name} — ${error.message}`])
  }
}

// Each page, rendered through the real shell.
for (const route of ['dashboard', 'people', 'reminders', 'ideas', 'settings']) {
  check(`page: ${route}`, () => {
    globalThis.window.location.hash = `#/${route}`
    return renderToString(h(App))
  })
}

// A person profile opened straight from the URL.
check('page: people/:id profile', () => {
  globalThis.window.location.hash = `#/people/${SEED_PEOPLE[0].id}`
  return renderToString(h(App))
})

// Unknown ids should fall back rather than crash.
check('page: people/:id unknown', () => {
  globalThis.window.location.hash = '#/people/does-not-exist'
  return renderToString(h(App))
})

check('page: unknown route falls back', () => {
  globalThis.window.location.hash = '#/nope'
  return renderToString(h(App))
})

// Empty state: no stored data at all.
check('page: dashboard with empty circle', () => {
  store.set('nudgeai.v3', JSON.stringify({ people: [], reminders: [], moments: [], savedIdeas: [] }))
  globalThis.window.location.hash = '#/dashboard'
  const html = renderToString(h(App))
  store.clear()
  return html
})

check('page: people with empty circle', () => {
  store.set('nudgeai.v3', JSON.stringify({ people: [], reminders: [], moments: [], savedIdeas: [] }))
  globalThis.window.location.hash = '#/people'
  const html = renderToString(h(App))
  store.clear()
  return html
})

// Migration from the previous v2 storage shape.
check('migration: v2 payload loads', () => {
  store.clear()
  store.set(
    'nudgeai-v2-data',
    JSON.stringify({
      firstName: 'Sam',
      dark: true,
      notifications: true,
      people: [{ id: 'p1', name: 'Maya', relationship: 'Partner', frequency: 'Weekly', color: 'coral' }],
      reminders: [{ id: 'r1', personId: 'p1', title: 'Old nudge', date: '2024-01-01', time: '09:00', done: false }],
    }),
  )
  globalThis.window.location.hash = '#/dashboard'
  const html = renderToString(h(App))
  store.clear()
  return html
})

// Forms and dialogs, rendered directly with representative props.
const wrap = (node) => renderToString(h(StoreProvider, null, node))
check('form: PersonForm (new)', () => wrap(h(PersonForm, { onSubmit() {}, onCancel() {} })))
check('form: PersonForm (edit)', () => wrap(h(PersonForm, { person: SEED_PEOPLE[0], onSubmit() {}, onCancel() {} })))
check('form: ReminderForm (new)', () => wrap(h(ReminderForm, { people: SEED_PEOPLE, onSubmit() {}, onCancel() {} })))
check('form: ReminderForm (edit)', () =>
  wrap(h(ReminderForm, { reminder: SEED_REMINDERS[0], people: SEED_PEOPLE, onSubmit() {}, onCancel() {} })))
check('form: MomentForm', () => wrap(h(MomentForm, { people: SEED_PEOPLE, onSubmit() {}, onCancel() {} })))
check('form: MomentForm with no people', () => wrap(h(MomentForm, { people: [], onSubmit() {}, onCancel() {} })))

const noop = () => {}
check('dialog: PersonDetail', () =>
  wrap(
    h(PersonDetail, {
      person: SEED_PEOPLE[0],
      reminders: SEED_REMINDERS,
      moments: [{ id: 'm1', personId: SEED_PEOPLE[0].id, kind: 'Called', note: 'Good chat', date: dates.todayISO() }],
      savedIdeas: [],
      onClose: noop,
      onEdit: noop,
      onDelete: noop,
      onAddReminder: noop,
      onLogMoment: noop,
      onToggleReminder: noop,
      onSnoozeReminder: noop,
      onEditReminder: noop,
      onDeleteReminder: noop,
      onSaveIdea: noop,
      onIdeaToReminder: noop,
    }),
  ))
check('dialog: PersonDetail with no history', () =>
  wrap(
    h(PersonDetail, {
      person: { ...SEED_PEOPLE[2], birthday: '', anniversary: '', notes: '', favorites: '', lastConnected: '' },
      reminders: [],
      moments: [],
      savedIdeas: [],
      onClose: noop,
      onEdit: noop,
      onDelete: noop,
      onAddReminder: noop,
      onLogMoment: noop,
      onToggleReminder: noop,
      onSnoozeReminder: noop,
      onEditReminder: noop,
      onDeleteReminder: noop,
      onSaveIdea: noop,
      onIdeaToReminder: noop,
    }),
  ))
check('dialog: ConfirmDialog', () =>
  wrap(h(ConfirmDialog, { title: 'Remove?', body: 'Gone for good.', onConfirm: noop, onClose: noop })))
check('dialog: Modal', () => wrap(h(Modal, { title: 'Hi', onClose: noop }, h('p', null, 'body'))))
check('ui: Toast with undo', () =>
  wrap(h(Toast, { toast: { id: '1', message: 'Deleted', action: { label: 'Undo', run: noop } }, onDismiss: noop })))
check('ui: EmptyState / ScoreDial / StatCard', () =>
  wrap(
    h(
      'div',
      null,
      h(EmptyState, { icon: () => null, title: 'None', body: 'Nothing here' }),
      h(ScoreDial, { value: 72, label: 'Steady', caption: 'Connection score' }),
      h(StatCard, { icon: () => null, value: 3, label: 'people' }),
    ),
  ))

// ---- store actions -------------------------------------------------------
// Render the provider once, capture its action bag, then invoke every action so
// the bodies are actually executed. State does not commit outside a real root,
// but any runtime error inside an action surfaces here.
const { useStore } = await import('../src/store.jsx')
let captured = null
function Probe() {
  captured = useStore()
  return h('span', null, 'ready')
}
check('store: provider exposes actions', () => renderToString(h(StoreProvider, null, h(Probe))))

check('store: every action runs without throwing', () => {
  const { actions } = captured
  const person = actions.savePerson({ name: 'Test Person', relationship: 'Friend' })
  actions.savePerson({ ...person, name: 'Renamed' })
  const reminder = actions.saveReminder({ title: 'Say thanks', personId: person.id })
  actions.saveReminder({ ...reminder, title: 'Say thanks properly' })
  actions.toggleReminder(reminder.id)
  actions.snoozeReminder(reminder.id, 1)
  actions.snoozeReminder(reminder.id, 7)
  actions.logMoment({ personId: person.id, kind: 'Called', note: 'Lovely chat' })
  actions.deleteMoment('missing-id')
  actions.toggleSavedIdea('Send a voice note')
  actions.toggleSavedIdea('Send a voice note')
  actions.setProfileName('Sam')
  actions.updateSettings({ theme: 'dark', notifications: true })
  actions.clearCompleted()
  actions.deleteReminder(reminder.id)
  actions.deletePerson(person.id)
  actions.loadSampleData()
  actions.resetAll()
  actions.notify('hello')
  return 'all actions executed without throwing'
})

check('store: replaceAll rejects a payload that is not an object', () => {
  try {
    captured.actions.replaceAll(null)
    throw new Error('expected replaceAll to reject null')
  } catch (error) {
    if (error.message === 'Unrecognised backup file') return 'rejected as expected'
    throw error
  }
})

check('store: replaceAll accepts a valid backup', () => {
  captured.actions.replaceAll({ people: SEED_PEOPLE, reminders: SEED_REMINDERS, profile: { name: 'Alex' } })
  return 'accepted'
})

// ---- pure logic ----------------------------------------------------------
const expect = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  results.push([ok ? 'PASS' : 'FAIL', ok ? name : `${name} — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`])
}

expect('dates: daysFromToday(today) === 0', dates.daysFromToday(dates.todayISO()), 0)
expect('dates: parseISO("") is null', dates.parseISO(''), null)
expect('dates: formatDate("") is "Not set"', dates.formatDate(''), 'Not set')
expect('dates: daysUntilNextAnnual(today) === 0', dates.daysUntilNextAnnual(dates.todayISO()), 0)
expect('dates: relativeDay(today)', dates.relativeDay(dates.todayISO()), 'Today')
expect('dates: countdownLabel(0)', dates.countdownLabel(0), 'Today')
expect('dates: countdownLabel(45)', dates.countdownLabel(45), '2mo')
expect('dates: sinceLabel(undefined)', dates.sinceLabel(''), 'No moments logged yet')
expect('dates: advanceDate weekly lands in the future', dates.daysFromToday(dates.advanceDate('2020-01-01', 'Weekly')) >= 0, true)
expect('dates: advanceDate Never is a no-op', dates.advanceDate('2020-01-01', 'Never'), '2020-01-01')
expect('dates: upcomingYears for a fixed birthday is sane', dates.upcomingYears('1990-01-01') > 30, true)

const sampleState = { people: SEED_PEOPLE, reminders: SEED_REMINDERS, moments: [], savedIdeas: [] }
expect('selectors: score is within 0-100', (() => {
  const s = selectors.connectionScore(sampleState)
  return s >= 0 && s <= 100
})(), true)
expect('selectors: empty circle scores 0', selectors.connectionScore({ people: [], reminders: [], moments: [] }), 0)
expect('selectors: focusPerson picks the most overdue', selectors.focusPerson(SEED_PEOPLE).id, 'seed-jordan')
expect('selectors: overduePeople finds Jordan', selectors.overduePeople(SEED_PEOPLE)[0].person.id, 'seed-jordan')
expect('selectors: openReminders returns both seeds', selectors.openReminders(SEED_REMINDERS).length, 2)
expect('selectors: dueReminders excludes future items', selectors.dueReminders(SEED_REMINDERS).every((r) => r.date <= dates.todayISO()), true)
expect('selectors: upcomingDates are sorted', (() => {
  const list = selectors.upcomingDates(SEED_PEOPLE, 400).map((d) => d.days)
  return list.every((v, i) => i === 0 || list[i - 1] <= v)
})(), true)
expect('selectors: ideasForPerson tailors to relationship', selectors.ideasForPerson(SEED_PEOPLE[0]).length > 0, true)
expect('selectors: suggestionFor with no person still returns copy', typeof selectors.suggestionFor(null), 'string')
expect('selectors: momentStreak with no moments is 0', selectors.momentStreak([]), 0)
expect('selectors: momentStreak counts today', selectors.momentStreak([{ date: dates.todayISO() }]), 1)
expect('selectors: momentsThisWeek counts today', selectors.momentsThisWeek([{ date: dates.todayISO() }]), 1)

const { migrate } = await import('../src/store.jsx')
expect('store: migrate(null) is null', migrate(null), null)
expect('store: migrate drops reminders pointing at unknown people', (() => {
  const out = migrate({ people: [], reminders: [{ id: 'r', personId: 'ghost', title: 'x' }] })
  return out.reminders[0].personId
})(), '')
expect('store: migrate carries the v2 name across', migrate({ firstName: 'Sam' }).profile.name, 'Sam')
expect('store: migrate maps the v2 dark flag to a theme', migrate({ dark: true }).settings.theme, 'dark')
expect('store: migrate maps frequency to cadence', migrate({ people: [{ id: 'a', name: 'A', frequency: 'Weekly' }] }).people[0].cadence, 'Weekly')

// ---- report -------------------------------------------------------------
const failures = results.filter(([status]) => status === 'FAIL')
results.forEach(([status, name]) => console.log(`${status}  ${name}`))
console.log(`\n${results.length - failures.length}/${results.length} checks passed`)
process.exit(failures.length ? 1 : 0)
