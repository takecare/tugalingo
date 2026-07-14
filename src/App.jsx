import { useState } from 'react'
import { useProgress } from './hooks/useProgress'
import { currentStreak, dateKey } from './lib/dates'
import { buildLessonContext, buildDebugLessonContext, activeQuestionTypes } from './lib/lessons'
import { isDebugMode } from './lib/debug'
import Lesson from './components/Lesson'
import Home from './components/Home'
import LessonResults from './components/LessonResults'
import DebugMenu from './components/DebugMenu'
import VersionBadge from './components/VersionBadge'
import './App.css'

function App() {
  const { progress, recordLessonCompletion, replaceProgress } = useProgress()
  const [view, setView] = useState({ screen: 'home' })
  const debugMode = isDebugMode()

  function startLesson() {
    setView({
      screen: 'lesson',
      context: buildLessonContext(progress),
      questionTypes: activeQuestionTypes(progress),
    })
  }

  function startDebugLesson(type) {
    setView({
      screen: 'lesson',
      context: buildDebugLessonContext(),
      questionTypes: [type],
      isDebug: true,
    })
  }

  function completeLesson(result) {
    if (view.isDebug) {
      setView({ screen: 'debug' })
      return
    }

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
        <Lesson
          context={view.context}
          questionTypes={view.questionTypes}
          onExit={() => setView({ screen: view.isDebug ? 'debug' : 'home' })}
          onComplete={completeLesson}
        />
        <VersionBadge />
      </div>
    )
  }

  if (view.screen === 'debug') {
    return (
      <div className="app">
        <DebugMenu onSelectType={startDebugLesson} onBack={() => setView({ screen: 'home' })} />
        <VersionBadge />
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
        <VersionBadge />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>tugalingo</h1>
        <p>learn Portuguese, one lesson at a time</p>
      </header>
      <Home
        progress={progress}
        onStartLesson={startLesson}
        onImportProgress={replaceProgress}
        debugMode={debugMode}
        onOpenDebug={() => setView({ screen: 'debug' })}
      />
      <VersionBadge />
    </div>
  )
}

export default App
