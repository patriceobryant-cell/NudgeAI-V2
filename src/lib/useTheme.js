/**
 * Applies the chosen theme to the document and reports whether dark is currently
 * active. "system" follows the OS preference live, so the app changes with the
 * user's device without a reload.
 */
import { useEffect, useState } from 'react'

const prefersDark = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)

const resolve = (preference) => preference === 'dark' || (preference === 'system' && prefersDark())

export function useTheme(preference) {
  const [isDark, setIsDark] = useState(() => resolve(preference))

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')

    const apply = () => {
      const dark = resolve(preference)
      setIsDark(dark)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#141c1b' : '#f7f2e7')
    }

    apply()
    if (preference !== 'system' || !media) return undefined
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])

  return isDark
}
