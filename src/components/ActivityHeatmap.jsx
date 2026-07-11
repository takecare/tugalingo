import { dateKey, lastNDays } from '../lib/dates'

const WEEKS = 12
const DAYS = WEEKS * 7

function levelFor(count) {
  if (!count) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  return 3
}

export default function ActivityHeatmap({ activityByDate }) {
  const today = new Date()
  const todayKey = dateKey(today)
  const days = lastNDays(DAYS, today)

  // Pad the front so the first column starts on a Sunday, like GitHub's graph.
  const padding = Array.from({ length: days[0].getDay() }, () => null)
  const cells = [...padding, ...days]
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div className="heatmap">
      <div className="heatmap__grid">
        {weeks.map((week, wi) => (
          <div className="heatmap__week" key={wi}>
            {week.map((day, di) => {
              if (!day) return <div className="heatmap__cell heatmap__cell--empty" key={di} />
              const key = dateKey(day)
              const count = activityByDate[key]?.lessonsCompleted ?? 0
              const isToday = key === todayKey
              return (
                <div
                  key={di}
                  className={`heatmap__cell heatmap__cell--level-${levelFor(count)}${isToday ? ' heatmap__cell--today' : ''}`}
                  title={`${key}: ${count} lesson${count === 1 ? '' : 's'}`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
