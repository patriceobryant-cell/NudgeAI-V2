/**
 * Shared UI primitives. Every page composes these so spacing, focus behaviour
 * and accessibility semantics stay consistent across the app.
 */
import { useEffect, useId, useRef } from 'react'
import { Check, Plus, X } from 'lucide-react'

export function Avatar({ person, size = 'md' }) {
  const initials = (person?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
  return (
    <span className={`avatar avatar--${size} accent-${person?.accent || 'teal'}`} aria-hidden="true">
      {initials || '?'}
    </span>
  )
}

export function Button({ variant = 'secondary', icon: Icon, children, className = '', ...props }) {
  return (
    <button type="button" className={`btn btn--${variant} ${className}`.trim()} {...props}>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, label, variant = '', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`icon-btn ${variant ? `icon-btn--${variant}` : ''} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon aria-hidden="true" />
    </button>
  )
}

export function Tag({ children, tone = 'neutral' }) {
  return <span className={`tag tag--${tone}`}>{children}</span>
}

export function EmptyState({ icon: Icon, title, body, actionLabel, onAction }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
      {onAction ? (
        <Button variant="primary" icon={Plus} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

/**
 * Dialog with a focus trap, Escape-to-close and scroll lock — the pieces that
 * separate a real modal from a floating div.
 */
export function Modal({ title, description, onClose, children, size = 'md' }) {
  const panel = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = panel.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const timer = setTimeout(() => {
      const target = panel.current?.querySelector('[data-autofocus], input, select, textarea, button')
      target?.focus()
    }, 20)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      clearTimeout(timer)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [onClose])

  return (
    <div className="scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`sheet sheet--${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panel}>
        <header className="sheet__head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p className="sheet__desc">{description}</p> : null}
          </div>
          <IconButton icon={X} label="Close dialog" onClick={onClose} />
        </header>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  )
}

/** Labelled form control wrapper that wires up hints and error messages. */
export function Field({ label, hint, error, required, children }) {
  const id = useId()
  const child =
    typeof children === 'function'
      ? children({ id, 'aria-describedby': hint || error ? `${id}-help` : undefined })
      : children
  return (
    <div className={`field ${error ? 'field--invalid' : ''}`.trim()}>
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {child}
      {error ? (
        <small className="field__error" id={`${id}-help`} role="alert">
          {error}
        </small>
      ) : hint ? (
        <small className="field__hint" id={`${id}-help`}>
          {hint}
        </small>
      ) : null}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'is-on' : ''}`.trim()}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  )
}

/** Circular progress dial used for the connection score. */
export function ScoreDial({ value, label, caption }) {
  return (
    <div className="dial" role="img" aria-label={`${label}: ${value} out of 100`}>
      <div className="dial__ring" style={{ '--sweep': `${value * 3.6}deg` }}>
        <span className="dial__value">{value}</span>
      </div>
      <div className="dial__meta">
        <strong>{label}</strong>
        <small>{caption}</small>
      </div>
    </div>
  )
}

export function StatCard({ icon: Icon, accent = 'teal', value, label, hint }) {
  return (
    <article className="stat">
      <span className={`stat__icon accent-soft-${accent}`}>
        <Icon aria-hidden="true" />
      </span>
      <div className="stat__body">
        <strong>{value}</strong>
        <small>{label}</small>
        {hint ? <span className="stat__hint">{hint}</span> : null}
      </div>
    </article>
  )
}

export function SectionHeader({ eyebrow, title, children }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {children ? <div className="section-head__actions">{children}</div> : null}
    </div>
  )
}

export function Toast({ toast, onDismiss }) {
  if (!toast) return null
  return (
    <div className="toast" role="status" aria-live="polite">
      <Check aria-hidden="true" />
      <span>{toast.message}</span>
      {toast.action ? (
        <button
          type="button"
          className="toast__action"
          onClick={() => {
            toast.action.run()
            onDismiss()
          }}
        >
          {toast.action.label}
        </button>
      ) : null}
      <IconButton icon={X} label="Dismiss" onClick={onDismiss} className="toast__close" />
    </div>
  )
}

/** Confirmation dialog for destructive actions — no native `confirm()` anywhere. */
export function ConfirmDialog({ title, body, confirmLabel = 'Delete', onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose} size="sm">
      <p className="confirm__body">{body}</p>
      <div className="form__actions">
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="danger"
          data-autofocus
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
