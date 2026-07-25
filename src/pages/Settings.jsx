/**
 * Settings: identity, appearance, notification permissions and full control over
 * the locally stored data — export, import, sample data and a hard reset.
 */
import { useMemo, useRef, useState } from 'react'
import {
  BellRing,
  Database,
  Download,
  Heart,
  Monitor,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
  UserRound,
} from 'lucide-react'
import { STORAGE_KEY } from '../store'
import { todayISO } from '../lib/dates'
import { notificationsSupported, permissionState, requestPermission, sendTestNotification } from '../lib/notifications'
import { Button, ConfirmDialog, Field, SectionHeader, Toggle } from '../components/ui'

const THEMES = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'system', label: 'System', icon: Monitor },
]

export function Settings({ state, actions }) {
  const importRef = useRef(null)
  const [permission, setPermission] = useState(() => permissionState())
  const [confirm, setConfirm] = useState(null)
  const { settings, profile, people, reminders, moments, savedIdeas } = state

  const storageSize = useMemo(() => {
    try {
      const bytes = new Blob([localStorage.getItem(STORAGE_KEY) || '']).size
      return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
    } catch {
      return '—'
    }
  }, [state])

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nudgeai-backup-${todayISO()}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    actions.notify('Backup downloaded')
  }

  const importBackup = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        actions.replaceAll(JSON.parse(String(reader.result)))
      } catch {
        actions.notify('That file is not a NudgeAI backup')
      }
    }
    reader.onerror = () => actions.notify('That file could not be read')
    reader.readAsText(file)
  }

  const enableNotifications = async () => {
    const result = await requestPermission()
    setPermission(result)
    if (result === 'granted') {
      actions.updateSettings({ notifications: true })
      actions.notify('Notifications are on')
    } else if (result === 'denied') {
      actions.updateSettings({ notifications: false })
      actions.notify('Your browser is blocking notifications for this site')
    } else if (result === 'unsupported') {
      actions.notify('This browser does not support notifications')
    }
  }

  const notificationsOn = settings.notifications && permission === 'granted'

  return (
    <div className="page page--narrow">
      <section className="panel">
        <SectionHeader eyebrow="You" title="Profile" />
        <Field label="Your first name" hint="Used in the greeting on your dashboard.">
          {(props) => (
            <input
              {...props}
              value={profile.name}
              maxLength={40}
              onChange={(event) => actions.setProfileName(event.target.value)}
              onBlur={(event) => !event.target.value.trim() && actions.setProfileName('Friend')}
            />
          )}
        </Field>
        <div className="setting">
          <span className="setting__icon accent-soft-teal">
            <UserRound aria-hidden="true" />
          </span>
          <div className="setting__text">
            <strong>Your circle</strong>
            <small>
              {people.length} {people.length === 1 ? 'person' : 'people'} · {reminders.length} reminders · {moments.length}{' '}
              logged moments · {savedIdeas.length} saved ideas
            </small>
          </div>
        </div>
      </section>

      <section className="panel">
        <SectionHeader eyebrow="Appearance" title="Theme" />
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {THEMES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={settings.theme === key}
              className={settings.theme === key ? 'is-active' : ''}
              onClick={() => actions.updateSettings({ theme: key })}
            >
              <Icon aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <p className="hint-text">System follows your device, switching automatically at sunset if your OS does.</p>
      </section>

      <section className="panel">
        <SectionHeader eyebrow="Gentle prompts" title="Notifications" />
        <div className="setting">
          <span className="setting__icon accent-soft-amber">
            <BellRing aria-hidden="true" />
          </span>
          <div className="setting__text">
            <strong>Browser notifications</strong>
            <small>
              {permission === 'granted'
                ? 'NudgeAI alerts you as each nudge becomes due while a tab is open.'
                : permission === 'denied'
                  ? 'Blocked in your browser settings — allow notifications for this site to turn them on.'
                  : 'Ask your browser for permission to send reminder alerts.'}
            </small>
          </div>
          {permission === 'granted' ? (
            <Toggle
              checked={Boolean(settings.notifications)}
              label="Browser notifications"
              onChange={(value) => {
                actions.updateSettings({ notifications: value })
                actions.notify(value ? 'Notifications are on' : 'Notifications paused')
              }}
            />
          ) : (
            <Button variant="primary" onClick={enableNotifications} disabled={!notificationsSupported()}>
              {permission === 'denied' ? 'Retry' : 'Enable'}
            </Button>
          )}
        </div>

        {notificationsOn ? (
          <div className="setting">
            <span className="setting__icon accent-soft-olive">
              <Sparkles aria-hidden="true" />
            </span>
            <div className="setting__text">
              <strong>Send a test</strong>
              <small>Check how a nudge looks on this device.</small>
            </div>
            <Button
              onClick={() => {
                const sent = sendTestNotification()
                actions.notify(sent ? 'Test notification sent' : 'Your browser refused to show it')
              }}
            >
              Send test
            </Button>
          </div>
        ) : null}

        <p className="hint-text">
          <TriangleAlert aria-hidden="true" /> NudgeAI runs entirely in your browser, so alerts arrive while a NudgeAI tab is
          open. Keep it pinned and reminders will find you.
        </p>
      </section>

      <section className="panel">
        <SectionHeader eyebrow="Your data" title="Backup and restore" />
        <p className="hint-text">
          <ShieldCheck aria-hidden="true" /> Everything you enter stays in this browser's local storage. Nothing is uploaded,
          and no account is needed. Export a backup before clearing browser data or moving to a new device.
        </p>
        <div className="setting">
          <span className="setting__icon accent-soft-teal">
            <Database aria-hidden="true" />
          </span>
          <div className="setting__text">
            <strong>Stored on this device</strong>
            <small>{storageSize} of local storage in use</small>
          </div>
        </div>
        <div className="button-row">
          <Button icon={Download} onClick={exportBackup}>
            Export JSON
          </Button>
          <Button icon={Upload} onClick={() => importRef.current?.click()}>
            Import JSON
          </Button>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importBackup} />
          <Button
            icon={Sparkles}
            onClick={() =>
              setConfirm({
                title: 'Load the sample circle?',
                body: 'This replaces your current people and reminders with NudgeAI’s example data. You can undo it straight after.',
                confirmLabel: 'Load sample data',
                run: actions.loadSampleData,
              })
            }
          >
            Load sample data
          </Button>
          <Button
            variant="danger-soft"
            icon={Trash2}
            onClick={() =>
              setConfirm({
                title: 'Erase everything?',
                body: 'Every person, reminder, logged moment and saved idea will be removed from this browser. Export a backup first if you might want them back.',
                confirmLabel: 'Erase everything',
                run: actions.resetAll,
              })
            }
          >
            Erase all data
          </Button>
        </div>
      </section>

      <footer className="page-footer">
        Built for the relationships that make life meaningful. <Heart aria-hidden="true" />
      </footer>

      {confirm ? (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.run}
          onClose={() => setConfirm(null)}
        />
      ) : null}
    </div>
  )
}
