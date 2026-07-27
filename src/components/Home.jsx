import { useRef, useState } from 'react'
import ActivityHeatmap from './ActivityHeatmap'
import { currentStreak, dateKey } from '../lib/dates'
import { downloadProgress, parseProgressFile } from '../lib/progressFile'

export default function Home({
  progress,
  onStartLesson,
  onImportProgress,
  debugMode,
  onOpenDebug,
  isAdmin,
  onOpenStudio,
  onOpenReminders,
  userEmail,
  onSignOut,
  migrationAvailable,
  onMigrate,
  onDismissMigration,
}) {
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
      {migrationAvailable && (
        <div className="migration-banner">
          <p>We found progress saved on this device from before accounts. Import it into your account?</p>
          <div className="migration-banner__actions">
            <button className="progress-io__button" onClick={onMigrate}>
              Import it
            </button>
            <button className="progress-io__button" onClick={onDismissMigration}>
              No thanks
            </button>
          </div>
        </div>
      )}

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
        <button className="progress-io__button" onClick={onOpenReminders}>
          Reminders
        </button>
        {debugMode && (
          <button className="progress-io__button" onClick={onOpenDebug}>
            Debug
          </button>
        )}
        {isAdmin && (
          <button className="progress-io__button" onClick={onOpenStudio}>
            Studio
          </button>
        )}
      </div>
      {importMessage && <p className="progress-io__message">{importMessage}</p>}

      <p className="home__account">
        Signed in as {userEmail} — <button className="home__sign-out" onClick={onSignOut}>Sign out</button>
      </p>
    </div>
  )
}
