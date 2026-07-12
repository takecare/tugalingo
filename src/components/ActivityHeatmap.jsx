import { dateKey, recentDays } from '../lib/dates'

const DAYS = 30
const COLUMNS = 7

function levelFor(count) {
  if (!count) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  return 3
}

export default function ActivityHeatmap({ activityByDate }) {
  const today = new Date()
  const todayKey = dateKey(today)
  const days = recentDays(DAYS, today)

  // Pad the front (not the end) so today is always the very last cell —
  // consecutive rows are exactly 7 days apart, so each column still lines up
  // with one consistent weekday throughout, ending on today's weekday.
  const padding = Array.from({ length: (COLUMNS - (days.length % COLUMNS)) % COLUMNS }, () => null)
  const cells = [...padding, ...days]
  const rows = []
  for (let i = 0; i < cells.length; i += COLUMNS) {
    rows.push(cells.slice(i, i + COLUMNS))
  }

  return (
    <div className="heatmap">
      <div className="heatmap__grid">
        {rows.map((row, ri) => (
          <div className="heatmap__row" key={ri}>
            {row.map((day, di) => {
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
