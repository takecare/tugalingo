import { useEffect, useState } from 'react'

const STORAGE_KEY = 'tugalingo-progress'

const defaultProgress = {
  totalCorrect: 0,
  totalAnswered: 0,
  bestStreak: 0,
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultProgress, ...JSON.parse(raw) } : defaultProgress
  } catch {
    return defaultProgress
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  function recordAnswer(correct, streak) {
    setProgress((prev) => ({
      totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
      totalAnswered: prev.totalAnswered + 1,
      bestStreak: Math.max(prev.bestStreak, streak),
    }))
  }

  return { progress, recordAnswer }
}
