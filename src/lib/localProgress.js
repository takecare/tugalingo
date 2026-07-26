import { isValidProgress } from './progressFile'

const STORAGE_KEY = 'tugalingo-progress'
const DISMISSED_KEY = 'tugalingo-migration-dismissed'

// The pure half: given whatever's in localStorage (or null), decide if it's
// worth offering to import. Split from readLocalProgress() below so this
// logic is testable without a real localStorage.
export function parseLocalProgress(raw) {
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isValidProgress(data) || data.history.length === 0) return null
  return { history: data.history, activityByDate: data.activityByDate }
}

// Reads whatever progress was left behind in localStorage by the
// pre-accounts version of the app (see docs/architecture.md#accounts--cloud-progress-sync
// for why this migration exists). Returns null if there's nothing worth
// offering to import — no data, invalid data, or a genuinely empty history.
export function readLocalProgress() {
  return parseLocalProgress(localStorage.getItem(STORAGE_KEY))
}

export function isMigrationDismissed() {
  return localStorage.getItem(DISMISSED_KEY) === 'true'
}

export function dismissMigration() {
  localStorage.setItem(DISMISSED_KEY, 'true')
}
