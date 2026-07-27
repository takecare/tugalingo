import { useState } from 'react'
import { isPushSupported, usePushSubscription } from '../hooks/usePushSubscription'
import { useNotificationSettings } from '../hooks/useNotificationSettings'

export default function NotificationSettings({ userId, onBack }) {
  const { settings, isLoading, saveSettings } = useNotificationSettings(userId)
  const { isSubscribed, isLoading: subscriptionLoading, subscribe, unsubscribe } = usePushSubscription(userId)
  const [draft, setDraft] = useState(null)
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  const supported = isPushSupported()
  const permission = supported ? Notification.permission : 'unsupported'
  const current = draft ?? settings

  function patch(fields) {
    setDraft({ ...current, ...fields })
  }

  // Shared by the enable toggle and the "enable on this device" prompt below
  // — both just need this browser subscribed before anything is turned on.
  async function trySubscribe() {
    setStatus(null)
    try {
      await subscribe()
      return true
    } catch {
      setStatus(
        Notification.permission === 'denied'
          ? "Notifications are blocked for this site — allow them in your browser's site settings, then try again."
          : "Couldn't turn on reminders. Please try again.",
      )
      return false
    }
  }

  async function handleToggle(e) {
    const wantsEnabled = e.target.checked
    if (wantsEnabled && !isSubscribed && !(await trySubscribe())) return
    patch({ enabled: wantsEnabled })
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await saveSettings(current)
    setSaving(false)
    setStatus(error ? "Couldn't save — please try again." : 'Saved.')
    if (!error) setDraft(null)
  }

  async function handleUnsubscribeDevice() {
    await unsubscribe()
    setStatus('Reminders turned off on this device.')
  }

  return (
    <div className="studio">
      <div className="studio__header">
        <button className="icon-exit-button" onClick={onBack}>
          ✕
        </button>
        <h2>Reminders</h2>
      </div>

      {!supported && (
        <p className="progress-io__message">
          This browser doesn't support push notifications, so reminders aren't available here.
        </p>
      )}

      {supported && isLoading ? (
        <p>Loading…</p>
      ) : (
        supported && (
          <div className="studio__form">
            {permission === 'denied' ? (
              <p className="progress-io__message">
                Notifications are blocked for this site — allow them in your browser's site settings to turn on
                reminders.
              </p>
            ) : (
              <label className="studio-field studio-field--checkbox">
                <input type="checkbox" checked={current.enabled} onChange={handleToggle} />
                <span>Remind me to do a lesson</span>
              </label>
            )}

            {current.enabled && !subscriptionLoading && !isSubscribed && permission !== 'denied' && (
              <p className="progress-io__message">
                Reminders are on for your account, but this device isn't set up to receive them yet.{' '}
                <button className="studio__button" onClick={trySubscribe}>
                  Enable on this device
                </button>
              </p>
            )}

            {current.enabled && (
              <>
                <label className="studio-field">
                  <span className="studio-field__label">Lessons per day I'm aiming for</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={current.dailyLessonGoal}
                    onChange={(e) => patch({ dailyLessonGoal: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </label>
                <label className="studio-field">
                  <span className="studio-field__label">Reminders per day until I hit that goal</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={current.maxRemindersPerDay}
                    onChange={(e) =>
                      patch({ maxRemindersPerDay: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })
                    }
                  />
                </label>
              </>
            )}

            <div className="studio__form-actions">
              <button
                className="studio__button studio__button--primary"
                onClick={handleSave}
                disabled={saving || !draft}
              >
                Save
              </button>
              {isSubscribed && (
                <button className="studio__button" onClick={handleUnsubscribeDevice}>
                  Turn off on this device
                </button>
              )}
            </div>
          </div>
        )
      )}

      {status && <p className="progress-io__message">{status}</p>}
    </div>
  )
}
