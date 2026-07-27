import { useEffect, useState } from 'react'
import { dateKey } from '../lib/dates'
import { supabase } from '../lib/supabaseClient'

function defaultProgress() {
  return {
    history: [], // [{ completedAt, correct, total }], one entry per completed lesson
    activityByDate: {}, // { [dateKey]: { lessonsCompleted } }
  }
}

// Keyed by the signed-in user's id — see supabase/schema.sql for the
// `progress` table this reads/writes (one row per user, RLS-scoped to
// auth.uid()). userId is null while signed out, in which case there's
// nothing to load or persist.
export function useProgress(userId) {
  const [progress, setProgress] = useState(defaultProgress)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setProgress(defaultProgress())
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    supabase
      .from('progress')
      .select('history, activity_by_date, timezone')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Failed to load progress', error)
        setProgress({
          history: data?.history ?? [],
          activityByDate: data?.activity_by_date ?? {},
        })
        setIsLoading(false)

        // The send-lesson-reminders edge function needs each user's real
        // timezone to know their "today" without a browser to ask — keep it
        // current, but only write when it's actually changed (new sign-in,
        // moved somewhere new) to avoid a write on every load.
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (detectedTimezone && data?.timezone !== detectedTimezone) {
          supabase
            .from('progress')
            .upsert({ user_id: userId, timezone: detectedTimezone }, { onConflict: 'user_id' })
            .then(({ error: tzError }) => {
              if (tzError) console.error('Failed to save timezone', tzError)
            })
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  async function persist(next) {
    setProgress(next)
    const { error } = await supabase.from('progress').upsert({
      user_id: userId,
      history: next.history,
      activity_by_date: next.activityByDate,
      updated_at: new Date().toISOString(),
    })
    if (error) console.error('Failed to save progress', error)
  }

  function recordLessonCompletion(correct, total) {
    const today = dateKey()
    const todayCount = progress.activityByDate[today]?.lessonsCompleted ?? 0

    return persist({
      history: [...progress.history, { completedAt: new Date().toISOString(), correct, total }],
      activityByDate: {
        ...progress.activityByDate,
        [today]: { lessonsCompleted: todayCount + 1 },
      },
    })
  }

  function replaceProgress(newProgress) {
    return persist(newProgress)
  }

  return { progress, isLoading, recordLessonCompletion, replaceProgress }
}
