/**
 * Full profile view for one person: their details, the moments you have logged,
 * their open nudges and ideas tailored to the relationship.
 */
import { Cake, CalendarHeart, Heart, History, Lightbulb, Pencil, Plus, Trash2 } from 'lucide-react'
import { CADENCE_DAYS } from '../data'
import { daysSince, formatDate, formatDayMonth, relativeDay, sinceLabel, upcomingYears } from '../lib/dates'
import { ideasForPerson, openReminders } from '../lib/selectors'
import { ReminderRow } from './ReminderRow'
import { Avatar, Button, EmptyState, IconButton, Modal, Tag } from './ui'

export function PersonDetail({
  person,
  reminders,
  moments,
  savedIdeas,
  onClose,
  onEdit,
  onDelete,
  onAddReminder,
  onLogMoment,
  onToggleReminder,
  onSnoozeReminder,
  onEditReminder,
  onDeleteReminder,
  onSaveIdea,
  onIdeaToReminder,
}) {
  const cadence = CADENCE_DAYS[person.cadence] ?? 30
  const since = daysSince(person.lastConnected)
  const overdueBy = (since === null ? cadence + 1 : since) - cadence
  const theirReminders = openReminders(reminders.filter((r) => r.personId === person.id))
  const theirMoments = moments.filter((m) => m.personId === person.id).sort((a, b) => b.date.localeCompare(a.date))
  const ideas = ideasForPerson(person).slice(0, 4)
  const nextBirthdayAge = upcomingYears(person.birthday)
  const anniversaryYears = upcomingYears(person.anniversary)

  return (
    <Modal title={person.name} description={`${person.relationship} · ${person.cadence} check-ins`} onClose={onClose} size="lg">
      <div className="profile">
        <header className="profile__head">
          <Avatar person={person} size="xl" />
          <div className="profile__head-meta">
            <div className="profile__tags">
              {overdueBy > 0 ? <Tag tone="coral">Overdue by {overdueBy} days</Tag> : <Tag tone="olive">On track</Tag>}
              <Tag tone="teal">{person.loveLanguage}</Tag>
            </div>
            <p>Last connected {sinceLabel(person.lastConnected).toLowerCase()}.</p>
          </div>
          <div className="profile__head-tools">
            <Button icon={Pencil} onClick={() => onEdit(person)}>
              Edit
            </Button>
            <Button variant="danger-soft" icon={Trash2} onClick={() => onDelete(person)}>
              Delete
            </Button>
          </div>
        </header>

        <div className="profile__quick">
          <Button variant="primary" icon={Heart} onClick={() => onLogMoment(person)}>
            Log a moment
          </Button>
          <Button icon={Plus} onClick={() => onAddReminder(person)}>
            New nudge
          </Button>
        </div>

        <dl className="profile__grid">
          <div>
            <dt>
              <Cake aria-hidden="true" /> Birthday
            </dt>
            <dd>
              {formatDate(person.birthday)}
              {person.birthday ? (
                <small>
                  {relativeDay(person.birthday) && nextBirthdayAge ? `Turning ${nextBirthdayAge} next time` : 'Coming up'}
                </small>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>
              <CalendarHeart aria-hidden="true" /> Anniversary
            </dt>
            <dd>
              {formatDate(person.anniversary)}
              {person.anniversary && anniversaryYears ? <small>Year {anniversaryYears} coming up</small> : null}
            </dd>
          </div>
          <div>
            <dt>Favourite things</dt>
            <dd>{person.favorites || <span className="muted">Nothing noted yet</span>}</dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{person.notes || <span className="muted">Nothing noted yet</span>}</dd>
          </div>
        </dl>

        <section className="profile__section">
          <h3>Open nudges</h3>
          {theirReminders.length ? (
            <div className="rows">
              {theirReminders.map((reminder) => (
                <ReminderRow
                  key={reminder.id}
                  reminder={reminder}
                  person={person}
                  onToggle={onToggleReminder}
                  onSnooze={onSnoozeReminder}
                  onEdit={onEditReminder}
                  onDelete={onDeleteReminder}
                />
              ))}
            </div>
          ) : (
            <p className="muted">No nudges scheduled for {person.name} yet.</p>
          )}
        </section>

        <section className="profile__section">
          <h3>
            <Lightbulb aria-hidden="true" /> Ideas that suit {person.name}
          </h3>
          <ul className="profile__ideas">
            {ideas.map((idea) => (
              <li key={idea.text}>
                <span>{idea.text}</span>
                <div className="profile__idea-actions">
                  <Button onClick={() => onIdeaToReminder(idea.text, person.id)}>Schedule</Button>
                  <IconButton
                    icon={Heart}
                    label={savedIdeas.includes(idea.text) ? 'Remove from saved ideas' : 'Save this idea'}
                    variant={savedIdeas.includes(idea.text) ? 'active' : ''}
                    onClick={() => onSaveIdea(idea.text)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="profile__section">
          <h3>
            <History aria-hidden="true" /> Moments together
          </h3>
          {theirMoments.length ? (
            <ol className="timeline">
              {theirMoments.slice(0, 12).map((moment) => (
                <li key={moment.id}>
                  <div>
                    <strong>{moment.kind}</strong>
                    <small>{formatDayMonth(moment.date)}</small>
                  </div>
                  {moment.note ? <p>{moment.note}</p> : null}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              icon={History}
              title="No moments logged"
              body={`Log a call, a visit or a message and NudgeAI will track your rhythm with ${person.name}.`}
              actionLabel="Log a moment"
              onAction={() => onLogMoment(person)}
            />
          )}
        </section>
      </div>
    </Modal>
  )
}
