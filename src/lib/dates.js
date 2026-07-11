export function dateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function lastNDays(n, endDate = new Date()) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days
}

// Consecutive days (ending today) with at least one completed lesson. If
// today has no lesson yet, today doesn't break the streak until it's over —
// so counting starts from yesterday instead, keeping yesterday's streak alive.
export function currentStreak(activityByDate, today = new Date()) {
  const cursor = new Date(today)
  const doneToday = (activityByDate[dateKey(cursor)]?.lessonsCompleted ?? 0) > 0
  if (!doneToday) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while ((activityByDate[dateKey(cursor)]?.lessonsCompleted ?? 0) > 0) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
