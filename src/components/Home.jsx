import ActivityHeatmap from './ActivityHeatmap'
import { currentStreak, dateKey } from '../lib/dates'

export default function Home({ progress, onStartLesson }) {
  const streak = currentStreak(progress.activityByDate)
  const doneToday = (progress.activityByDate[dateKey()]?.lessonsCompleted ?? 0) > 0

  let statusLine
  if (doneToday) {
    statusLine = 'Lesson done today ✅'
  } else if (streak > 0) {
    statusLine = 'Do a lesson today to keep your streak!'
  } else {
    statusLine = 'Do a lesson to start your streak!'
  }

  return (
    <div className="home">
      <div className={doneToday ? 'streak streak--done' : 'streak'}>
        <div className="streak__count">
          🔥 {streak} <span className="streak__label">day streak</span>
        </div>
        <p className="streak__status">{statusLine}</p>
      </div>

      <ActivityHeatmap activityByDate={progress.activityByDate} />

      <p className="home__stats">📚 {progress.history.length} lessons completed in total</p>

      <button className="new-lesson-button" onClick={onStartLesson}>
        New Lesson
      </button>
    </div>
  )
}
