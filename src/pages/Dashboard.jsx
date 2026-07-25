/**
 * Dashboard: the answer to "who needs me today?" — one suggested action, the
 * numbers that matter, what is due, who has gone quiet, and what is coming up.
 */
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Bell,
  Cake,
  CalendarHeart,
  Flame,
  Heart,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react'
import { STARTERS } from '../data'
import { countdownLabel, formatDayMonth, sinceLabel } from '../lib/dates'
import {
  connectionScore,
  focusPerson,
  isOverdue,
  momentStreak,
  momentsThisWeek,
  openReminders,
  overduePeople,
  scoreLabel,
  suggestionFor,
  upcomingDates,
} from '../lib/selectors'
import { ReminderRow } from '../components/ReminderRow'
import { Avatar, Button, EmptyState, ScoreDial, SectionHeader, StatCard } from '../components/ui'

export function Dashboard({ state, navigate, onAddPerson, onAddReminder, onScheduleIdea, onOpenPerson, onLogMoment, actions }) {
  const { people, reminders, moments } = state
  const [starterIndex, setStarterIndex] = useState(0)
  const [suggestionSalt, setSuggestionSalt] = useState(0)

  const open = useMemo(() => openReminders(reminders), [reminders])
  const dueSoon = open.slice(0, 5)
  const overdueCount = open.filter(isOverdue).length
  const quiet = useMemo(() => overduePeople(people).slice(0, 4), [people])
  const celebrations = useMemo(() => upcomingDates(people, 90).slice(0, 5), [people])
  const focus = useMemo(() => focusPerson(people), [people])
  const suggestion = useMemo(() => suggestionFor(focus, suggestionSalt), [focus, suggestionSalt])
  const score = useMemo(() => connectionScore(state), [state])
  const streak = useMemo(() => momentStreak(moments), [moments])
  const weekly = useMemo(() => momentsThisWeek(moments), [moments])

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">
            <Sparkles aria-hidden="true" /> Today’s suggested action
          </p>
          {focus ? (
            <>
              <h2>
                Make <span className="hero__name">{focus.name}</span> feel thought of today.
              </h2>
              <p className="hero__idea">{suggestion}</p>
              <div className="hero__actions">
                <Button variant="onDark" onClick={() => onScheduleIdea(suggestion, focus.id)}>
                  Schedule this <ArrowRight aria-hidden="true" />
                </Button>
                <Button variant="ghostOnDark" onClick={() => onLogMoment(focus)}>
                  I did it
                </Button>
                <Button variant="ghostOnDark" icon={RotateCcw} onClick={() => setSuggestionSalt((n) => n + 1)}>
                  Another idea
                </Button>
              </div>
              <p className="hero__foot">
                {focus.name} · last connected {sinceLabel(focus.lastConnected).toLowerCase()}
              </p>
            </>
          ) : (
            <>
              <h2>Start with one person who matters.</h2>
              <p className="hero__idea">
                Add someone to your circle and NudgeAI will suggest a thoughtful, specific way to show up for them.
              </p>
              <div className="hero__actions">
                <Button variant="onDark" onClick={onAddPerson}>
                  Add your first person <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </div>
        <Heart className="hero__mark" aria-hidden="true" />
      </section>

      <div className="stats">
        <article className="stat stat--dial">
          <ScoreDial value={score} label={scoreLabel(score)} caption="Connection score" />
        </article>
        <StatCard icon={Users} accent="coral" value={people.length} label={people.length === 1 ? 'person in your circle' : 'people in your circle'} />
        <StatCard
          icon={Bell}
          accent="amber"
          value={open.length}
          label="open nudges"
          hint={overdueCount ? `${overdueCount} overdue` : 'all on schedule'}
        />
        <StatCard icon={Flame} accent="olive" value={streak} label={streak === 1 ? 'day streak' : 'day streak'} hint={`${weekly} moments this week`} />
      </div>

      <section className="starter">
        <div>
          <p className="eyebrow">
            <Sparkles aria-hidden="true" /> Conversation starter
          </p>
          <blockquote>{STARTERS[starterIndex % STARTERS.length]}</blockquote>
        </div>
        <Button icon={RotateCcw} onClick={() => setStarterIndex((n) => n + 1)}>
          Another
        </Button>
      </section>

      <div className="columns">
        <section className="panel">
          <SectionHeader eyebrow="Stay intentional" title="Due next">
            <Button onClick={() => navigate('reminders')}>
              View all <ArrowRight aria-hidden="true" />
            </Button>
          </SectionHeader>
          {dueSoon.length ? (
            <div className="rows">
              {dueSoon.map((reminder) => (
                <ReminderRow
                  key={reminder.id}
                  reminder={reminder}
                  person={people.find((p) => p.id === reminder.personId)}
                  onToggle={actions.toggleReminder}
                  onSnooze={actions.snoozeReminder}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="A clear horizon"
              body="Nothing is due. Schedule the next thoughtful thing while you are thinking of it."
              actionLabel="New nudge"
              onAction={() => onAddReminder()}
            />
          )}
        </section>

        <div className="stack">
          <section className="panel">
            <SectionHeader eyebrow="Gone quiet" title="Needs attention" />
            {quiet.length ? (
              <ul className="quiet">
                {quiet.map(({ person, overdueBy }) => (
                  <li key={person.id}>
                    <button type="button" onClick={() => onOpenPerson(person)}>
                      <Avatar person={person} size="sm" />
                      <span>
                        <strong>{person.name}</strong>
                        <small>{sinceLabel(person.lastConnected)}</small>
                      </span>
                    </button>
                    <span className="quiet__badge">+{overdueBy}d</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Heart}
                title={people.length ? 'Everyone is on track' : 'Your circle is empty'}
                body={
                  people.length
                    ? 'Every person in your circle has been in touch within their rhythm.'
                    : 'Add the people you want to be more intentional about.'
                }
                actionLabel="Add someone"
                onAction={people.length ? undefined : onAddPerson}
              />
            )}
          </section>

          <section className="panel">
            <SectionHeader eyebrow="Coming up" title="Dates to remember" />
            {celebrations.length ? (
              <ul className="dates">
                {celebrations.map((entry) => (
                  <li key={entry.key}>
                    <button type="button" onClick={() => onOpenPerson(entry.person)}>
                      <Avatar person={entry.person} size="sm" />
                      <span>
                        <strong>
                          {entry.person.name}’s {entry.kind.toLowerCase()}
                        </strong>
                        <small>{formatDayMonth(entry.date)}</small>
                      </span>
                    </button>
                    <span className={`dates__badge ${entry.days <= 7 ? 'is-soon' : ''}`.trim()}>
                      {entry.kind === 'Birthday' ? <Cake aria-hidden="true" /> : <CalendarHeart aria-hidden="true" />}
                      {countdownLabel(entry.days)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Cake}
                title="No dates yet"
                body="Add birthdays and anniversaries so a celebration never sneaks up on you."
                actionLabel={people.length ? undefined : 'Add someone'}
                onAction={people.length ? undefined : onAddPerson}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
