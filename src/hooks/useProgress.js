import { useEffect, useState } from 'react'
import { dateKey } from '../lib/dates'

const STORAGE_KEY = 'tugalingo-progress'

function defaultProgress() {
  return {
    history: [], // [{ completedAt, correct, total }], one entry per completed lesson
    activityByDate: {}, // { [dateKey]: { lessonsCompleted } }
  }
}

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!raw) return defaultProgress()
    return {
      history: raw.history ?? [],
      activityByDate: raw.activityByDate ?? {},
    }
  } catch {
    return defaultProgress()
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  function recordLessonCompletion(correct, total) {
    setProgress((prev) => {
      const today = dateKey()
      const todayCount = prev.activityByDate[today]?.lessonsCompleted ?? 0

      return {
        history: [...prev.history, { completedAt: new Date().toISOString(), correct, total }],
        activityByDate: {
          ...prev.activityByDate,
          [today]: { lessonsCompleted: todayCount + 1 },
        },
      }
    })
  }

  return { progress, recordLessonCompletion }
}
