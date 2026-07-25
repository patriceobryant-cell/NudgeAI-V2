/**
 * Reminder list row. Handles completion, snoozing, editing and deleting inline so
 * the common actions never need a detour through a dialog.
 */
import { Check, Clock, Pencil, Repeat, Trash2 } from 'lucide-react'
import { formatDayMonth, formatTime, relativeDay } from '../lib/dates'
import { isOverdue, isToday } from '../lib/selectors'
import { Avatar, IconButton, Tag } from './ui'

export function ReminderRow({ reminder, person, onToggle, onSnooze, onEdit, onDelete }) {
  const overdue = isOverdue(reminder)
  const due = isToday(reminder)

  return (
    <div className={`row ${reminder.done ? 'is-done' : ''} ${overdue ? 'is-overdue' : ''}`.trim()}>
      <button
        type="button"
        className="row__check"
        onClick={() => onToggle(reminder.id)}
        aria-pressed={reminder.done}
        aria-label={reminder.done ? `Reopen ${reminder.title}` : `Complete ${reminder.title}`}
      >
        {reminder.done ? <Check aria-hidden="true" /> : null}
      </button>

      <div className="row__body">
        <strong>{reminder.title}</strong>
        <span className="row__meta">
          {person ? <span className="row__person">{person.name}</span> : <span className="row__person">General</span>}
          <span aria-hidden="true">·</span>
          <span>
            {formatDayMonth(reminder.date)} at {formatTime(reminder.time)}
          </span>
          {reminder.repeat !== 'Never' ? (
            <span className="row__repeat">
              <Repeat aria-hidden="true" /> {reminder.repeat}
            </span>
          ) : null}
        </span>
        {reminder.notes ? <p className="row__notes">{reminder.notes}</p> : null}
      </div>

      <div className="row__side">
        {!reminder.done && overdue ? <Tag tone="coral">Overdue · {relativeDay(reminder.date)}</Tag> : null}
        {!reminder.done && due ? <Tag tone="amber">Today</Tag> : null}
        {person ? <Avatar person={person} size="sm" /> : null}
      </div>

      <div className="row__actions">
        {!reminder.done && onSnooze ? (
          <IconButton icon={Clock} label={`Snooze ${reminder.title} until tomorrow`} onClick={() => onSnooze(reminder.id, 1)} />
        ) : null}
        {onEdit ? <IconButton icon={Pencil} label={`Edit ${reminder.title}`} onClick={() => onEdit(reminder)} /> : null}
        {onDelete ? (
          <IconButton icon={Trash2} label={`Delete ${reminder.title}`} variant="danger" onClick={() => onDelete(reminder)} />
        ) : null}
      </div>
    </div>
  )
}
