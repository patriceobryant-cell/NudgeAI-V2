/**
 * Minimal hash router. Hash routing keeps deep links working on any static host
 * without extra configuration, and gives the back button real meaning inside the
 * app (including opening a person straight from a URL).
 */
import { useCallback, useEffect, useState } from 'react'

export const ROUTES = ['dashboard', 'people', 'reminders', 'ideas', 'settings']

/** Parses `#/people/abc123` into `{ page: 'people', param: 'abc123' }`. */
export function parseHash(hash = window.location.hash) {
  const clean = hash.replace(/^#\/?/, '')
  const [page = '', param = ''] = clean.split('/')
  const normalised = page.toLowerCase()
  return {
    page: ROUTES.includes(normalised) ? normalised : 'dashboard',
    param: decodeURIComponent(param),
  }
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash())

  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    if (!window.location.hash) window.location.replace('#/dashboard')
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((page, param) => {
    const next = param ? `#/${page}/${encodeURIComponent(param)}` : `#/${page}`
    if (window.location.hash === next) setRoute(parseHash(next))
    else window.location.hash = next
  }, [])

  return { ...route, navigate }
}
