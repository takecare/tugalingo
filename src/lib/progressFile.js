import { dateKey } from './dates'

function isValidHistory(history) {
  return (
    Array.isArray(history) &&
    history.every(
      (entry) =>
        entry &&
        typeof entry.completedAt === 'string' &&
        typeof entry.correct === 'number' &&
        typeof entry.total === 'number',
    )
  )
}

function isValidActivity(activityByDate) {
  return (
    activityByDate !== null &&
    typeof activityByDate === 'object' &&
    Object.values(activityByDate).every((day) => day && typeof day.lessonsCompleted === 'number')
  )
}

function isValidProgress(data) {
  return data !== null && typeof data === 'object' && isValidHistory(data.history) && isValidActivity(data.activityByDate)
}

export function downloadProgress(progress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tugalingo-progress-${dateKey()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function parseProgressFile(file) {
  let text
  try {
    text = await file.text()
  } catch {
    throw new Error("Couldn't read that file.")
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON.")
  }

  if (!isValidProgress(data)) {
    throw new Error("That file doesn't look like a tugalingo progress export.")
  }

  return { history: data.history, activityByDate: data.activityByDate }
}
