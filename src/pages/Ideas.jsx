/**
 * Ideas: a browsable bank of specific, doable gestures. Ideas can be tailored to a
 * person, saved for later, copied, or turned straight into a scheduled nudge.
 */
import { useMemo, useState } from 'react'
import { ArrowRight, Bookmark, BookmarkCheck, Copy, Lightbulb, RotateCcw, Sparkles } from 'lucide-react'
import { IDEA_BANK, IDEA_CATEGORIES, STARTERS } from '../data'
import { ideasForPerson } from '../lib/selectors'
import { Avatar, Button, EmptyState, IconButton, SectionHeader } from '../components/ui'

export function Ideas({ state, actions, onScheduleIdea }) {
  const { people, savedIdeas } = state
  const [category, setCategory] = useState('All')
  const [personId, setPersonId] = useState('')
  const [onlySaved, setOnlySaved] = useState(false)
  const [starterIndex, setStarterIndex] = useState(0)

  const person = people.find((p) => p.id === personId) || null

  const ideas = useMemo(() => {
    let pool = person ? ideasForPerson(person) : IDEA_BANK
    if (category !== 'All') pool = pool.filter((idea) => idea.category === category)
    if (onlySaved) pool = pool.filter((idea) => savedIdeas.includes(idea.text))
    return pool
  }, [person, category, onlySaved, savedIdeas])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      actions.notify('Idea copied to your clipboard')
    } catch {
      actions.notify('Copying is blocked in this browser')
    }
  }

  return (
    <div className="page">
      <section className="starter starter--feature">
        <div>
          <p className="eyebrow">
            <Sparkles aria-hidden="true" /> Conversation starter
          </p>
          <blockquote>{STARTERS[starterIndex % STARTERS.length]}</blockquote>
          <p className="starter__note">Curiosity is one of the kindest forms of attention.</p>
        </div>
        <Button icon={RotateCcw} onClick={() => setStarterIndex((n) => n + 1)}>
          Another question
        </Button>
      </section>

      <div className="ideas-controls">
        <div className="chips" role="group" aria-label="Idea categories">
          {['All', ...IDEA_CATEGORIES].map((option) => (
            <button
              key={option}
              type="button"
              className={category === option ? 'is-active' : ''}
              aria-pressed={category === option}
              onClick={() => setCategory(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="ideas-controls__right">
          <label className="inline-field">
            Tailor for
            <select value={personId} onChange={(event) => setPersonId(event.target.value)} disabled={!people.length}>
              <option value="">Anyone</option>
              {people.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant={onlySaved ? 'primary' : 'secondary'}
            icon={onlySaved ? BookmarkCheck : Bookmark}
            onClick={() => setOnlySaved((value) => !value)}
            aria-pressed={onlySaved}
          >
            Saved {savedIdeas.length ? `(${savedIdeas.length})` : ''}
          </Button>
        </div>
      </div>

      {person ? (
        <div className="tailored-note">
          <Avatar person={person} size="sm" />
          <p>
            Showing ideas that suit a <strong>{person.relationship.toLowerCase()}</strong> whose love language is{' '}
            <strong>{person.loveLanguage.toLowerCase()}</strong>. Scheduling an idea assigns it to {person.name}.
          </p>
        </div>
      ) : null}

      {ideas.length ? (
        <div className="grid grid--ideas">
          {ideas.map((idea, index) => {
            const saved = savedIdeas.includes(idea.text)
            return (
              <article className="idea" key={idea.text}>
                <div className="idea__top">
                  <span className="idea__index">{String(index + 1).padStart(2, '0')}</span>
                  <IconButton
                    icon={saved ? BookmarkCheck : Bookmark}
                    label={saved ? 'Remove from saved ideas' : 'Save this idea'}
                    variant={saved ? 'active' : ''}
                    onClick={() => actions.toggleSavedIdea(idea.text)}
                  />
                </div>
                <p className="idea__category">{idea.category}</p>
                <h3>{idea.text}</h3>
                <div className="idea__actions">
                  <Button onClick={() => onScheduleIdea(idea.text, personId)}>
                    Schedule <ArrowRight aria-hidden="true" />
                  </Button>
                  <IconButton icon={Copy} label="Copy idea text" onClick={() => copy(idea.text)} />
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Lightbulb}
          title={onlySaved ? 'No saved ideas yet' : 'Nothing in this category'}
          body={
            onlySaved
              ? 'Bookmark the ideas that feel like you and they will collect here for the next time you need one.'
              : 'Try another category or clear the person filter.'
          }
          actionLabel="Show all ideas"
          onAction={() => {
            setOnlySaved(false)
            setCategory('All')
          }}
        />
      )}

      {savedIdeas.length && !onlySaved ? (
        <section className="panel saved-panel">
          <SectionHeader eyebrow="Your shortlist" title="Saved ideas" />
          <ul className="saved-list">
            {savedIdeas.map((text) => (
              <li key={text}>
                <span>{text}</span>
                <div>
                  <Button onClick={() => onScheduleIdea(text, personId)}>Schedule</Button>
                  <IconButton icon={BookmarkCheck} label="Remove from saved" variant="active" onClick={() => actions.toggleSavedIdea(text)} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
