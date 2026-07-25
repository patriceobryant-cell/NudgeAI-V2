/**
 * Person card used on the People page grid. Shows just enough to act on — who
 * they are, when you last connected, and what is coming up.
 */
import { CalendarHeart, Cake, Clock3, Pencil, Trash2 } from 'lucide-react'
import { CADENCE_DAYS } from '../data'
import { countdownLabel, daysSince, daysUntilNextAnnual, sinceLabel } from '../lib/dates'
import { Avatar, IconButton, Tag } from './ui'

export function PersonCard({ person, reminderCount, onOpen, onEdit, onDelete }) {
  const cadence = CADENCE_DAYS[person.cadence] ?? 30
  const since = daysSince(person.lastConnected)
  const overdueBy = (since === null ? cadence + 1 : since) - cadence
  const birthdayIn = daysUntilNextAnnual(person.birthday)
  const anniversaryIn = daysUntilNextAnnual(person.anniversary)

  return (
    <article className="person">
      <div className="person__top">
        <button type="button" className="person__identity" onClick={() => onOpen(person)}>
          <Avatar person={person} size="lg" />
          <span>
            <strong>{person.name}</strong>
            <small>{person.relationship}</small>
          </span>
        </button>
        <div className="person__tools">
          <IconButton icon={Pencil} label={`Edit ${person.name}`} onClick={() => onEdit(person)} />
          <IconButton icon={Trash2} label={`Delete ${person.name}`} variant="danger" onClick={() => onDelete(person)} />
        </div>
      </div>

      <div className="person__tags">
        {overdueBy > 0 ? (
          <Tag tone="coral">Overdue by {overdueBy}d</Tag>
        ) : (
          <Tag tone="olive">On track</Tag>
        )}
        <Tag>{person.cadence}</Tag>
        {reminderCount ? <Tag tone="teal">{reminderCount} open nudge{reminderCount === 1 ? '' : 's'}</Tag> : null}
      </div>

      {person.notes ? <p className="person__notes">{person.notes}</p> : null}

      <dl className="person__facts">
        <div>
          <dt>
            <Clock3 aria-hidden="true" /> Last connected
          </dt>
          <dd>{sinceLabel(person.lastConnected)}</dd>
        </div>
        <div>
          <dt>
            <Cake aria-hidden="true" /> Birthday
          </dt>
          <dd>{person.birthday ? countdownLabel(birthdayIn) : 'Not set'}</dd>
        </div>
        <div>
          <dt>
            <CalendarHeart aria-hidden="true" /> Anniversary
          </dt>
          <dd>{person.anniversary ? countdownLabel(anniversaryIn) : 'Not set'}</dd>
        </div>
      </dl>

      <button type="button" className="person__open" onClick={() => onOpen(person)}>
        Open profile
      </button>
    </article>
  )
}
