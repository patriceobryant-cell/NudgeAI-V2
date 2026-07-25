/**
 * Reminders: everything scheduled, split into the views people actually think in —
 * what is late, what is today, what is ahead, and what is already done.
 */
import { useMemo, useState } from 'react'
import { Bell, CheckCheck, ListChecks, Plus } from 'lucide-react'
import { formatDate, relativeDay } from '../lib/dates'
import { completedReminders, isOverdue, isToday, openReminders } from '../lib/selectors'
import { ReminderRow } from '../components/ReminderRow'
import { Button, EmptyState } from '../components/ui'

const VIEWS = [
  { key: 'all', label: 'All open' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'done', label: 'Completed' },
]

export function Reminders({ state, actions, onAddReminder, onEditReminder, onDeleteReminder }) {
  const { reminders, people } = state
  const [view, setView] = useState('all')
  const [personFilter, setPersonFilter] = useState('all')

  const counts = useMemo(() => {
    const open = openReminders(reminders)
    return {
      all: open.length,
      overdue: open.filter(isOverdue).length,
      today: open.filter(isToday).length,
      upcoming: open.filter((r) => !isOverdue(r) && !isToday(r)).length,
      done: reminders.filter((r) => r.done).length,
    }
  }, [reminders])

  const list = useMemo(() => {
    const base = view === 'done' ? completedReminders(reminders) : openReminders(reminders)
    return base
      .filter((reminder) => {
        if (personFilter === 'all') return true
        if (personFilter === 'none') return !reminder.personId
        return reminder.personId === personFilter
      })
      .filter((reminder) => {
        if (view === 'overdue') return isOverdue(reminder)
        if (view === 'today') return isToday(reminder)
        if (view === 'upcoming') return !isOverdue(reminder) && !isToday(reminder)
        return true
      })
  }, [reminders, view, personFilter])

  /** Groups a list by date so the page reads like a schedule rather than a dump. */
  const groups = useMemo(() => {
    const map = new Map()
    list.forEach((reminder) => {
      const key = view === 'done' ? reminder.completedAt || reminder.date : reminder.date
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(reminder)
    })
    return [...map.entries()]
  }, [list, view])

  return (
    <div className="page">
      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Reminder views">
          {VIEWS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={view === option.key}
              className={view === option.key ? 'is-active' : ''}
              onClick={() => setView(option.key)}
            >
              {option.label}
              <span className="tabs__count">{counts[option.key]}</span>
            </button>
          ))}
        </div>
        <div className="toolbar__filters">
          <label className="inline-field">
            For
            <select value={personFilter} onChange={(event) => setPersonFilter(event.target.value)}>
              <option value="all">Everyone</option>
              <option value="none">No one in particular</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          {view === 'done' && counts.done ? (
            <Button icon={CheckCheck} onClick={actions.clearCompleted}>
              Clear completed
            </Button>
          ) : null}
          <Button variant="primary" icon={Plus} onClick={() => onAddReminder()}>
            New nudge
          </Button>
        </div>
      </div>

      {groups.length ? (
        <div className="schedule">
          {groups.map(([date, items]) => (
            <section className="panel" key={date}>
              <header className="schedule__head">
                <h2>{formatDate(date)}</h2>
                <span>{relativeDay(date)}</span>
              </header>
              <div className="rows">
                {items.map((reminder) => (
                  <ReminderRow
                    key={reminder.id}
                    reminder={reminder}
                    person={people.find((p) => p.id === reminder.personId)}
                    onToggle={actions.toggleReminder}
                    onSnooze={view === 'done' ? undefined : actions.snoozeReminder}
                    onEdit={onEditReminder}
                    onDelete={onDeleteReminder}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={view === 'done' ? ListChecks : Bell}
          title={view === 'done' ? 'Nothing completed yet' : 'Nothing here'}
          body={
            view === 'done'
              ? 'Tick off a nudge and the kind things you have already done will collect here.'
              : 'Give your future self a gentle prompt — it is the whole point of NudgeAI.'
          }
          actionLabel={view === 'done' ? undefined : 'Create a nudge'}
          onAction={view === 'done' ? undefined : () => onAddReminder()}
        />
      )}
    </div>
  )
}
