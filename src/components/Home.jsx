import { useRef, useState } from 'react'
import ActivityHeatmap from './ActivityHeatmap'
import { currentStreak, dateKey } from '../lib/dates'
import { downloadProgress, parseProgressFile } from '../lib/progressFile'

export default function Home({ progress, onStartLesson, onImportProgress }) {
  const fileInputRef = useRef(null)
  const [importMessage, setImportMessage] = useState(null)

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

  async function handleFileSelected(e) {
    const file = e.target.files[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return

    try {
      const imported = await parseProgressFile(file)
      if (!window.confirm('Importing will replace your current progress on this device. Continue?')) {
        return
      }
      onImportProgress(imported)
      setImportMessage('Progress imported.')
    } catch (err) {
      setImportMessage(err.message)
    }
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

      <div className="progress-io">
        <button className="progress-io__button" onClick={() => downloadProgress(progress)}>
          Export progress
        </button>
        <button className="progress-io__button" onClick={() => fileInputRef.current.click()}>
          Import progress
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="progress-io__input"
          onChange={handleFileSelected}
        />
      </div>
      {importMessage && <p className="progress-io__message">{importMessage}</p>}
    </div>
  )
}
