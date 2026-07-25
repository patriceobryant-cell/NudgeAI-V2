/**
 * Data-entry forms. Each one validates locally, reports errors inline next to the
 * offending control, and hands a complete record back to the store on submit.
 */
import { useState } from 'react'
import { ACCENTS, CADENCES, LOVE_LANGUAGES, MOMENT_KINDS, RELATIONSHIPS, REPEATS } from '../data'
import { todayISO } from '../lib/dates'
import { uid } from '../store'
import { Button, Field } from './ui'

const blankPerson = () => ({
  name: '',
  relationship: 'Friend',
  birthday: '',
  anniversary: '',
  favorites: '',
  notes: '',
  loveLanguage: 'Quality time',
  cadence: 'Monthly',
  accent: 'teal',
  lastConnected: '',
})

export function PersonForm({ person, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({ ...blankPerson(), ...person }))
  const [errors, setErrors] = useState({})

  const set = (key) => (event) => {
    const { value } = event.target
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'A name helps NudgeAI make this personal.'
    if (form.birthday && form.birthday > todayISO()) next.birthday = 'Birthdays cannot be in the future.'
    if (form.anniversary && form.anniversary > todayISO()) next.anniversary = 'Pick a date that has already happened.'
    if (form.lastConnected && form.lastConnected > todayISO()) next.lastConnected = 'That date is in the future.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = (event) => {
    event.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, id: form.id || uid(), name: form.name.trim() })
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Name" required error={errors.name}>
        {(props) => (
          <input {...props} data-autofocus value={form.name} onChange={set('name')} placeholder="Who matters to you?" maxLength={60} />
        )}
      </Field>

      <div className="form__row">
        <Field label="Relationship">
          {(props) => (
            <select {...props} value={form.relationship} onChange={set('relationship')}>
              {RELATIONSHIPS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Check-in rhythm" hint="Drives the “needs attention” list.">
          {(props) => (
            <select {...props} value={form.cadence} onChange={set('cadence')}>
              {CADENCES.map((option) => (
                <option key={option.label}>{option.label}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="form__row">
        <Field label="Birthday" error={errors.birthday}>
          {(props) => <input {...props} type="date" value={form.birthday} onChange={set('birthday')} max={todayISO()} />}
        </Field>
        <Field label="Anniversary" error={errors.anniversary}>
          {(props) => <input {...props} type="date" value={form.anniversary} onChange={set('anniversary')} max={todayISO()} />}
        </Field>
      </div>

      <Field label="Love language" hint="Shapes which ideas NudgeAI puts first.">
        {(props) => (
          <select {...props} value={form.loveLanguage} onChange={set('loveLanguage')}>
            {LOVE_LANGUAGES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Favourite things">
        {(props) => (
          <input {...props} value={form.favorites} onChange={set('favorites')} placeholder="Foods, music, places, small comforts…" />
        )}
      </Field>

      <Field label="Notes" hint="Anything you want to remember to ask about.">
        {(props) => <textarea {...props} rows={3} value={form.notes} onChange={set('notes')} />}
      </Field>

      <Field label="Last time you connected" error={errors.lastConnected}>
        {(props) => <input {...props} type="date" value={form.lastConnected} onChange={set('lastConnected')} max={todayISO()} />}
      </Field>

      <fieldset className="form__fieldset">
        <legend>Colour</legend>
        <div className="swatches">
          {ACCENTS.map((accent) => (
            <button
              key={accent}
              type="button"
              className={`swatch accent-${accent} ${form.accent === accent ? 'is-selected' : ''}`.trim()}
              aria-label={accent}
              aria-pressed={form.accent === accent}
              onClick={() => setForm((prev) => ({ ...prev, accent }))}
            />
          ))}
        </div>
      </fieldset>

      <div className="form__actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">
          {person?.id ? 'Save changes' : 'Add to my circle'}
        </Button>
      </div>
    </form>
  )
}

export function ReminderForm({ reminder, people, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    title: '',
    personId: '',
    date: todayISO(),
    time: '09:00',
    repeat: 'Never',
    notes: '',
    ...reminder,
  }))
  const [errors, setErrors] = useState({})

  const set = (key) => (event) => {
    const { value } = event.target
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = (event) => {
    event.preventDefault()
    const next = {}
    if (!form.title.trim()) next.title = 'What should this nudge say?'
    if (!form.date) next.date = 'Choose a date.'
    if (!form.time) next.time = 'Choose a time.'
    setErrors(next)
    if (Object.keys(next).length) return
    onSubmit({ ...form, id: form.id || uid(), title: form.title.trim() })
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Nudge" required error={errors.title}>
        {(props) => (
          <input
            {...props}
            data-autofocus
            value={form.title}
            onChange={set('title')}
            placeholder="Call Dad about the garden"
            maxLength={120}
          />
        )}
      </Field>

      <Field label="Who is it for?">
        {(props) => (
          <select {...props} value={form.personId} onChange={set('personId')}>
            <option value="">No one in particular</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="form__row">
        <Field label="Date" error={errors.date}>
          {(props) => <input {...props} type="date" value={form.date} onChange={set('date')} />}
        </Field>
        <Field label="Time" error={errors.time}>
          {(props) => <input {...props} type="time" value={form.time} onChange={set('time')} />}
        </Field>
      </div>

      <Field label="Repeat" hint="Completing a repeating nudge rolls it to the next date.">
        {(props) => (
          <select {...props} value={form.repeat} onChange={set('repeat')}>
            {REPEATS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Notes">
        {(props) => <textarea {...props} rows={2} value={form.notes} onChange={set('notes')} placeholder="Optional detail" />}
      </Field>

      <div className="form__actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">
          {reminder?.id ? 'Save reminder' : 'Schedule nudge'}
        </Button>
      </div>
    </form>
  )
}

/** Records something that already happened, which resets the person's cadence. */
export function MomentForm({ people, personId, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    personId: personId || people[0]?.id || '',
    kind: 'Called',
    note: '',
    date: todayISO(),
  })
  const [error, setError] = useState('')

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    if (!form.personId) {
      setError('Choose who this moment was with.')
      return
    }
    onSubmit({ ...form, id: uid() })
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field label="Who with?" required error={error}>
        {(props) => (
          <select {...props} data-autofocus value={form.personId} onChange={set('personId')}>
            <option value="">Select someone</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="form__row">
        <Field label="What happened?">
          {(props) => (
            <select {...props} value={form.kind} onChange={set('kind')}>
              {MOMENT_KINDS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="When">
          {(props) => <input {...props} type="date" value={form.date} onChange={set('date')} max={todayISO()} />}
        </Field>
      </div>

      <Field label="Worth remembering" hint="A detail you might want to bring up next time.">
        {(props) => <textarea {...props} rows={2} value={form.note} onChange={set('note')} />}
      </Field>

      <div className="form__actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">
          Log moment
        </Button>
      </div>
    </form>
  )
}
