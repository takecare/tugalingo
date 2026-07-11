import { useState } from 'react'
import { useProgress } from './hooks/useProgress'
import { currentStreak, dateKey } from './lib/dates'
import { currentWordPool } from './lib/lessons'
import Lesson from './components/Lesson'
import Home from './components/Home'
import LessonResults from './components/LessonResults'
import './App.css'

function App() {
  const { progress, recordLessonCompletion } = useProgress()
  const [view, setView] = useState({ screen: 'home' })

  function startLesson() {
    setView({ screen: 'lesson', pool: currentWordPool(progress) })
  }

  function completeLesson(result) {
    const bestBefore = progress.history.reduce((best, h) => Math.max(best, h.correct / h.total), -Infinity)
    const isNewBest = progress.history.length > 0 && result.correct / result.total > bestBefore

    // Project what today's activity will look like once this completion is
    // recorded, so the streak shown here matches what Home will show next.
    const today = dateKey()
    const todayCountBefore = progress.activityByDate[today]?.lessonsCompleted ?? 0
    const projectedActivity = {
      ...progress.activityByDate,
      [today]: { lessonsCompleted: todayCountBefore + 1 },
    }
    const streak = currentStreak(projectedActivity)

    recordLessonCompletion(result.correct, result.total)
    setView({ screen: 'results', result, isNewBest, streak })
  }

  if (view.screen === 'lesson') {
    return (
      <div className="app">
        <Lesson pool={view.pool} onExit={() => setView({ screen: 'home' })} onComplete={completeLesson} />
      </div>
    )
  }

  if (view.screen === 'results') {
    return (
      <div className="app">
        <LessonResults
          result={view.result}
          isNewBest={view.isNewBest}
          streak={view.streak}
          onContinue={() => setView({ screen: 'home' })}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>tugalingo</h1>
        <p>learn Portuguese, one lesson at a time</p>
      </header>
      <Home progress={progress} onStartLesson={startLesson} />
    </div>
  )
}

export default App
