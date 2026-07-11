import ActivityHeatmap from './ActivityHeatmap'
import { dateKey } from '../lib/dates'
import { nextUnlockedLesson } from '../lib/lessons'

const LOCKED_PREVIEW_COUNT = 3

export default function LessonMap({ progress, onStartLesson }) {
  const unlockedMax = nextUnlockedLesson(progress)
  const lessonNumbers = Array.from({ length: unlockedMax + LOCKED_PREVIEW_COUNT }, (_, i) => i + 1)

  const todayCount = progress.activityByDate[dateKey()]?.lessonsCompleted ?? 0

  return (
    <div className="lesson-map">
      <div className={todayCount > 0 ? 'today-banner today-banner--done' : 'today-banner'}>
        {todayCount > 0
          ? `✅ Lesson done today (${todayCount})`
          : 'No lesson done today yet — let’s go!'}
      </div>

      <ActivityHeatmap activityByDate={progress.activityByDate} />

      <p className="lesson-map__stats">📚 {progress.totalLessonsCompleted} lessons completed in total</p>

      <div className="lesson-path">
        {lessonNumbers.map((n) => {
          const record = progress.lessons[String(n)]
          const locked = n > unlockedMax
          return (
            <button
              key={n}
              className={
                'lesson-node' +
                (locked ? ' lesson-node--locked' : '') +
                (record ? ' lesson-node--completed' : '')
              }
              disabled={locked}
              onClick={() => onStartLesson(n)}
            >
              <span className="lesson-node__number">{locked ? '🔒' : n}</span>
              <span className="lesson-node__label">Lesson {n}</span>
              {record && (
                <span className="lesson-node__score">
                  Best: {record.bestCorrect}/{record.bestTotal}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
