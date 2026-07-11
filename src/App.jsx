import { useState } from 'react'
import { useProgress } from './hooks/useProgress'
import Lesson from './components/Lesson'
import LessonMap from './components/LessonMap'
import LessonResults from './components/LessonResults'
import './App.css'

function App() {
  const { progress, recordLessonCompletion } = useProgress()
  const [view, setView] = useState({ screen: 'map' })

  if (view.screen === 'lesson') {
    return (
      <div className="app">
        <Lesson
          lessonNumber={view.lessonNumber}
          onExit={() => setView({ screen: 'map' })}
          onComplete={(result) => {
            const prevRecord = progress.lessons[String(view.lessonNumber)]
            const isNewBest =
              !!prevRecord && result.correct / result.total > prevRecord.bestCorrect / prevRecord.bestTotal
            recordLessonCompletion(view.lessonNumber, result.correct, result.total)
            setView({ screen: 'results', lessonNumber: view.lessonNumber, result, isNewBest })
          }}
        />
      </div>
    )
  }

  if (view.screen === 'results') {
    return (
      <div className="app">
        <LessonResults
          lessonNumber={view.lessonNumber}
          result={view.result}
          isNewBest={view.isNewBest}
          onContinue={() => setView({ screen: 'map' })}
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
      <LessonMap progress={progress} onStartLesson={(n) => setView({ screen: 'lesson', lessonNumber: n })} />
    </div>
  )
}

export default App
