import { useCallback, useEffect, useState } from 'react'
import { isDebugMode } from '../lib/debug'

// Screens whose view can be rebuilt from nothing but their name — safe to
// restore directly from a history entry (e.g. after the back button).
// 'lesson' and 'results' carry runtime-only data (question sets, scores)
// that only ever lives in memory, so a bare history entry can't reconstruct
// them; landing on those via back/forward falls back to home instead.
const RESTORABLE_SCREENS = new Set(['home', 'debug', 'studio', 'reminders'])

const HASH_FOR_SCREEN = {
  debug: '#/debug',
  studio: '#/studio',
  reminders: '#/reminders',
  lesson: '#/lesson',
  results: '#/results',
}

function urlFor(screen) {
  const hash = HASH_FOR_SCREEN[screen] ?? ''
  return window.location.pathname + window.location.search + hash
}

function screenFromHash(hash) {
  if (hash === '#/debug') return isDebugMode() ? 'debug' : 'home'
  if (hash === '#/studio') return 'studio'
  if (hash === '#/reminders') return 'reminders'
  return 'home'
}

// Keeps the app's current screen in sync with the browser's address bar and
// history, so opening a feature (studio, debug menu, a lesson) updates the
// URL and the back button returns to the previous screen instead of leaving
// the app stuck on whatever it was showing.
export function useUrlView() {
  const [view, setView] = useState(() => ({ screen: screenFromHash(window.location.hash) }))

  useEffect(() => {
    // Normalize the entry the app booted into — clears a stale/disallowed
    // hash (e.g. #/debug without ?debug=true) from the address bar.
    window.history.replaceState({ screen: view.screen }, '', urlFor(view.screen))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onPopState(event) {
      const screen = event.state?.screen ?? screenFromHash(window.location.hash)
      if (RESTORABLE_SCREENS.has(screen)) {
        setView({ screen })
      } else {
        setView({ screen: 'home' })
        window.history.replaceState({ screen: 'home' }, '', urlFor('home'))
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((nextView, { replace = false } = {}) => {
    setView(nextView)
    const url = urlFor(nextView.screen)
    if (replace) {
      window.history.replaceState({ screen: nextView.screen }, '', url)
    } else {
      window.history.pushState({ screen: nextView.screen }, '', url)
    }
  }, [])

  const goBack = useCallback(() => {
    window.history.back()
  }, [])

  return { view, navigate, goBack }
}
