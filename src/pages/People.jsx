/**
 * People: search, filter and sort the circle, then drill into a profile.
 */
import { useMemo, useState } from 'react'
import { Search, UserPlus, UserRound } from 'lucide-react'
import { RELATIONSHIPS } from '../data'
import { daysSince, daysUntilNextAnnual } from '../lib/dates'
import { openReminders, overduePeople } from '../lib/selectors'
import { PersonCard } from '../components/PersonCard'
import { Button, EmptyState } from '../components/ui'

const SORTS = [
  { key: 'attention', label: 'Needs attention' },
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'recent', label: 'Recently connected' },
  { key: 'celebration', label: 'Next celebration' },
]

export function People({ state, onAddPerson, onEditPerson, onDeletePerson, onOpenPerson }) {
  const { people, reminders } = state
  const [query, setQuery] = useState('')
  const [relationship, setRelationship] = useState('All')
  const [sort, setSort] = useState('attention')

  const overdueRank = useMemo(() => {
    const map = new Map()
    overduePeople(people).forEach(({ person, overdueBy }) => map.set(person.id, overdueBy))
    return map
  }, [people])

  const openCounts = useMemo(() => {
    const counts = new Map()
    openReminders(reminders).forEach((r) => counts.set(r.personId, (counts.get(r.personId) || 0) + 1))
    return counts
  }, [reminders])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = people.filter((person) => {
      const matchesRelationship = relationship === 'All' || person.relationship === relationship
      if (!matchesRelationship) return false
      if (!needle) return true
      return [person.name, person.relationship, person.notes, person.favorites, person.loveLanguage]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle))
    })

    const sorted = [...filtered]
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'recent')
      sorted.sort((a, b) => (daysSince(a.lastConnected) ?? 9999) - (daysSince(b.lastConnected) ?? 9999))
    else if (sort === 'celebration')
      sorted.sort((a, b) => {
        const next = (p) => Math.min(daysUntilNextAnnual(p.birthday) ?? 9999, daysUntilNextAnnual(p.anniversary) ?? 9999)
        return next(a) - next(b)
      })
    else sorted.sort((a, b) => (overdueRank.get(b.id) ?? -9999) - (overdueRank.get(a.id) ?? -9999))
    return sorted
  }, [people, query, relationship, sort, overdueRank])

  const relationshipOptions = useMemo(
    () => ['All', ...RELATIONSHIPS.filter((option) => people.some((person) => person.relationship === option))],
    [people],
  )

  if (!people.length) {
    return (
      <div className="page">
        <EmptyState
          icon={UserRound}
          title="Your circle starts here"
          body="Add the people you want to show up for. NudgeAI keeps their dates, rhythms and the details worth remembering."
          actionLabel="Add your first person"
          onAction={onAddPerson}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="toolbar">
        <div className="search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search names, notes, favourites…"
            aria-label="Search people"
          />
        </div>
        <div className="toolbar__filters">
          <label className="inline-field">
            Show
            <select value={relationship} onChange={(event) => setRelationship(event.target.value)}>
              {relationshipOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="inline-field">
            Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              {SORTS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button variant="primary" icon={UserPlus} onClick={onAddPerson}>
            Add person
          </Button>
        </div>
      </div>

      <p className="result-count">
        {visible.length} of {people.length} {people.length === 1 ? 'person' : 'people'}
      </p>

      {visible.length ? (
        <div className="grid grid--people">
          {visible.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              reminderCount={openCounts.get(person.id) || 0}
              onOpen={onOpenPerson}
              onEdit={onEditPerson}
              onDelete={onDeletePerson}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No matches"
          body="Try a different name, or clear the filters to see everyone again."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery('')
            setRelationship('All')
          }}
        />
      )}
    </div>
  )
}
