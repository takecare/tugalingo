import { useEffect, useState } from 'react'
import { dateKey } from '../lib/dates'

const STORAGE_KEY = 'tugalingo-progress'

function defaultProgress() {
  return {
    totalLessonsCompleted: 0,
    lessons: {}, // { [lessonNumber]: { attempts, bestCorrect, bestTotal, lastPlayedAt } }
    activityByDate: {}, // { [dateKey]: { lessonsCompleted } }
  }
}

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!raw) return defaultProgress()
    return {
      totalLessonsCompleted: raw.totalLessonsCompleted ?? 0,
      lessons: raw.lessons ?? {},
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

  function recordLessonCompletion(lessonNumber, correct, total) {
    setProgress((prev) => {
      const key = String(lessonNumber)
      const existing = prev.lessons[key]
      const isBest = !existing || correct / total > existing.bestCorrect / existing.bestTotal
      const today = dateKey()
      const todayCount = prev.activityByDate[today]?.lessonsCompleted ?? 0

      return {
        totalLessonsCompleted: prev.totalLessonsCompleted + 1,
        lessons: {
          ...prev.lessons,
          [key]: {
            attempts: (existing?.attempts ?? 0) + 1,
            bestCorrect: isBest ? correct : existing.bestCorrect,
            bestTotal: isBest ? total : existing.bestTotal,
            lastPlayedAt: new Date().toISOString(),
          },
        },
        activityByDate: {
          ...prev.activityByDate,
          [today]: { lessonsCompleted: todayCount + 1 },
        },
      }
    })
  }

  return { progress, recordLessonCompletion }
}
