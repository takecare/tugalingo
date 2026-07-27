import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function defaultSettings() {
  return { enabled: false, dailyLessonGoal: 1, maxRemindersPerDay: 3 }
}

// Keyed by the signed-in user's id — see supabase/schema.sql's
// `notification_settings` table (one row per user, RLS-scoped to
// auth.uid()). No row yet just means "not configured", so reads fall back
// to defaultSettings() rather than treating it as an error.
export function useNotificationSettings(userId) {
  const [settings, setSettings] = useState(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setSettings(defaultSettings())
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    supabase
      .from('notification_settings')
      .select('enabled, daily_lesson_goal, max_reminders_per_day')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Failed to load notification settings', error)
        setSettings({
          enabled: data?.enabled ?? false,
          dailyLessonGoal: data?.daily_lesson_goal ?? 1,
          maxRemindersPerDay: data?.max_reminders_per_day ?? 3,
        })
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  async function saveSettings(next) {
    setSettings(next)
    const { error } = await supabase.from('notification_settings').upsert({
      user_id: userId,
      enabled: next.enabled,
      daily_lesson_goal: next.dailyLessonGoal,
      max_reminders_per_day: next.maxRemindersPerDay,
      updated_at: new Date().toISOString(),
    })
    if (error) console.error('Failed to save notification settings', error)
    return { error }
  }

  return { settings, isLoading, saveSettings }
}
