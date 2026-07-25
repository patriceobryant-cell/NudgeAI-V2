/**
 * App shell: navigation, the header, the dialog layer and the notification
 * scheduler. Pages stay presentational; every mutation goes through the store.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, Heart, LayoutDashboard, Lightbulb, Moon, Plus, Settings as SettingsIcon, Sparkles, Sun, Users } from 'lucide-react'
import { StoreProvider, useStore } from './store'
import { useRoute } from './lib/router'
import { useTheme } from './lib/useTheme'
import { useReminderNotifications } from './lib/notifications'
import { greeting, longDate } from './lib/dates'
import { openReminders } from './lib/selectors'
import { MomentForm, PersonForm, ReminderForm } from './components/forms'
import { PersonDetail } from './components/PersonDetail'
import { Avatar, Button, ConfirmDialog, IconButton, Modal, Toast } from './components/ui'
import { Dashboard } from './pages/Dashboard'
import { People } from './pages/People'
import { Reminders } from './pages/Reminders'
import { Ideas } from './pages/Ideas'
import { Settings } from './pages/Settings'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'people', label: 'People', icon: Users },
  { key: 'reminders', label: 'Reminders', icon: Bell },
  { key: 'ideas', label: 'Ideas', icon: Lightbulb },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
]

const PAGE_COPY = {
  people: { title: 'Your circle', eyebrow: 'People' },
  reminders: { title: 'Reminders', eyebrow: 'Nudges' },
  ideas: { title: 'Ideas', eyebrow: 'Inspiration' },
  settings: { title: 'Settings', eyebrow: 'Preferences' },
}

function Shell() {
  const { state, actions, toast, dismissToast } = useStore()
  const { page, param, navigate } = useRoute()
  const [dialog, setDialog] = useState(null)

  const isDark = useTheme(state.settings.theme)
  useReminderNotifications({
    enabled: Boolean(state.settings.notifications),
    reminders: state.reminders,
    people: state.people,
  })

  const openCount = useMemo(() => openReminders(state.reminders).length, [state.reminders])
  const closeDialog = useCallback(() => setDialog(null), [])

  // `#/people/<id>` opens that profile directly, so profiles are linkable.
  const routedPerson = page === 'people' && param ? state.people.find((p) => p.id === param) : null
  useEffect(() => {
    if (page === 'people' && param && !routedPerson) navigate('people')
  }, [page, param, routedPerson, navigate])

  const openPerson = useCallback((person) => navigate('people', person.id), [navigate])
  const closePerson = useCallback(() => navigate('people'), [navigate])

  const scheduleIdea = useCallback((title, personId = '') => {
    setDialog({ type: 'reminder', value: { title, personId } })
  }, [])

  const pageProps = {
    state,
    actions,
    navigate,
    onAddPerson: () => setDialog({ type: 'person' }),
    onEditPerson: (person) => setDialog({ type: 'person', value: person }),
    onDeletePerson: (person) => setDialog({ type: 'confirm-person', value: person }),
    onOpenPerson: openPerson,
    onAddReminder: (person) => setDialog({ type: 'reminder', value: person ? { personId: person.id } : undefined }),
    onEditReminder: (reminder) => setDialog({ type: 'reminder', value: reminder }),
    onDeleteReminder: (reminder) => setDialog({ type: 'confirm-reminder', value: reminder }),
    onLogMoment: (person) => setDialog({ type: 'moment', value: person ? { personId: person.id } : undefined }),
    onScheduleIdea: scheduleIdea,
  }

  const headerCopy = PAGE_COPY[page]

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <aside className="sidebar">
        <button type="button" className="brand" onClick={() => navigate('dashboard')}>
          <span className="brand__mark">
            <Heart aria-hidden="true" />
          </span>
          <span className="brand__text">
            NudgeAI
            <small>Love, remembered.</small>
          </span>
        </button>

        <nav aria-label="Primary">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" className={page === key ? 'is-active' : ''} onClick={() => navigate(key)}>
              <Icon aria-hidden="true" />
              {label}
              {key === 'reminders' && openCount ? <span className="nav__badge">{openCount}</span> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar__card">
          <Sparkles aria-hidden="true" />
          <strong>Small moments matter</strong>
          <p>One specific, well-timed gesture beats a dozen good intentions.</p>
          <Button variant="onLight" onClick={() => setDialog({ type: 'moment' })}>
            Log a moment
          </Button>
        </div>

        <div className="sidebar__profile">
          <Avatar person={{ name: state.profile.name, accent: 'teal' }} size="sm" />
          <span>
            <strong>{state.profile.name}</strong>
            <small>Private to this device</small>
          </span>
        </div>
      </aside>

      <main id="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">{headerCopy ? headerCopy.eyebrow : longDate()}</p>
            <h1>{headerCopy ? headerCopy.title : `${greeting()}, ${state.profile.name}`}</h1>
          </div>
          <div className="topbar__actions">
            <IconButton
              icon={isDark ? Sun : Moon}
              label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={() => actions.updateSettings({ theme: isDark ? 'light' : 'dark' })}
            />
            {page === 'people' ? (
              <Button variant="primary" icon={Plus} onClick={pageProps.onAddPerson}>
                Add person
              </Button>
            ) : page === 'settings' ? null : (
              <Button variant="primary" icon={Plus} onClick={() => pageProps.onAddReminder()}>
                New nudge
              </Button>
            )}
          </div>
        </header>

        {page === 'dashboard' ? <Dashboard {...pageProps} /> : null}
        {page === 'people' ? <People {...pageProps} /> : null}
        {page === 'reminders' ? <Reminders {...pageProps} /> : null}
        {page === 'ideas' ? <Ideas {...pageProps} /> : null}
        {page === 'settings' ? <Settings {...pageProps} /> : null}
      </main>

      <nav className="tabbar" aria-label="Primary">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" className={page === key ? 'is-active' : ''} onClick={() => navigate(key)}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {routedPerson ? (
        <PersonDetail
          person={routedPerson}
          reminders={state.reminders}
          moments={state.moments}
          savedIdeas={state.savedIdeas}
          onClose={closePerson}
          onEdit={pageProps.onEditPerson}
          onDelete={pageProps.onDeletePerson}
          onAddReminder={pageProps.onAddReminder}
          onLogMoment={pageProps.onLogMoment}
          onToggleReminder={actions.toggleReminder}
          onSnoozeReminder={actions.snoozeReminder}
          onEditReminder={pageProps.onEditReminder}
          onDeleteReminder={pageProps.onDeleteReminder}
          onSaveIdea={actions.toggleSavedIdea}
          onIdeaToReminder={scheduleIdea}
        />
      ) : null}

      {dialog?.type === 'person' ? (
        <Modal
          title={dialog.value?.id ? `Edit ${dialog.value.name}` : 'Add someone to your circle'}
          description="Only the name is required — everything else makes the nudges better."
          onClose={closeDialog}
        >
          <PersonForm
            person={dialog.value}
            onCancel={closeDialog}
            onSubmit={(person) => {
              actions.savePerson(person)
              closeDialog()
            }}
          />
        </Modal>
      ) : null}

      {dialog?.type === 'reminder' ? (
        <Modal
          title={dialog.value?.id ? 'Edit reminder' : 'Schedule a nudge'}
          description="NudgeAI will surface it on the day, and notify you if notifications are on."
          onClose={closeDialog}
        >
          <ReminderForm
            reminder={dialog.value}
            people={state.people}
            onCancel={closeDialog}
            onSubmit={(reminder) => {
              actions.saveReminder(reminder)
              closeDialog()
            }}
          />
        </Modal>
      ) : null}

      {dialog?.type === 'moment' ? (
        <Modal
          title="Log a moment"
          description="Recording what you already did keeps your check-in rhythm accurate."
          onClose={closeDialog}
          size="sm"
        >
          {state.people.length ? (
            <MomentForm
              people={state.people}
              personId={dialog.value?.personId}
              onCancel={closeDialog}
              onSubmit={(moment) => {
                actions.logMoment(moment)
                closeDialog()
              }}
            />
          ) : (
            <div className="form">
              <p>Add someone to your circle first, then you can log moments with them.</p>
              <div className="form__actions">
                <Button onClick={closeDialog}>Close</Button>
                <Button
                  variant="primary"
                  onClick={() => setDialog({ type: 'person' })}
                >
                  Add a person
                </Button>
              </div>
            </div>
          )}
        </Modal>
      ) : null}

      {dialog?.type === 'confirm-person' ? (
        <ConfirmDialog
          title={`Remove ${dialog.value.name}?`}
          body={`Their reminders and logged moments will be removed too. You can undo this straight away.`}
          confirmLabel="Remove person"
          onConfirm={() => {
            actions.deletePerson(dialog.value.id)
            if (routedPerson?.id === dialog.value.id) closePerson()
          }}
          onClose={closeDialog}
        />
      ) : null}

      {dialog?.type === 'confirm-reminder' ? (
        <ConfirmDialog
          title="Delete this reminder?"
          body={`“${dialog.value.title}” will be removed from your schedule.`}
          confirmLabel="Delete reminder"
          onConfirm={() => actions.deleteReminder(dialog.value.id)}
          onClose={closeDialog}
        />
      ) : null}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
