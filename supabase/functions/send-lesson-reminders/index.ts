// Sends lesson-reminder push notifications. Invoked on a schedule by
// pg_cron (see the "Reminder notifications" cron block at the bottom of
// supabase/schema.sql) — not meant to be called from the app itself.
//
// For each user with notification_settings.enabled = true: works out
// "today" from their progress.timezone, and if they're short of their
// daily_lesson_goal and haven't already had max_reminders_per_day
// reminders today, sends one push (spaced out — see shouldSendReminder
// below, mirrored from src/lib/reminderSchedule.js; keep both in sync)
// to every browser/device they've subscribed from.
//
// Deploy: supabase functions deploy send-lesson-reminders
// Secrets (supabase secrets set ...): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT (a mailto: address). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided automatically by the platform.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const QUIET_HOURS_START = 9 // inclusive, local hour
const QUIET_HOURS_END = 21 // exclusive, local hour

function shouldSendReminder({
  lessonsToday,
  dailyGoal,
  sendsToday,
  maxRemindersPerDay,
  lastSentAt,
  now,
  localHour,
}: {
  lessonsToday: number
  dailyGoal: number
  sendsToday: number
  maxRemindersPerDay: number
  lastSentAt: Date | null
  now: Date
  localHour: number
}): boolean {
  if (lessonsToday >= dailyGoal) return false
  if (sendsToday >= maxRemindersPerDay) return false
  if (localHour < QUIET_HOURS_START || localHour >= QUIET_HOURS_END) return false

  const windowMs = (QUIET_HOURS_END - QUIET_HOURS_START) * 60 * 60 * 1000
  const minGapMs = windowMs / maxRemindersPerDay
  if (lastSentAt && now.getTime() - lastSentAt.getTime() < minGapMs) return false

  return true
}

function localDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    date,
  )
}

function localHourOf(date: Date, timeZone: string): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(date))
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
  const vapidSubject = Deno.env.get('VAPID_SUBJECT')!

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: settingsRows, error: settingsError } = await supabase
    .from('notification_settings')
    .select('user_id, daily_lesson_goal, max_reminders_per_day')
    .eq('enabled', true)

  if (settingsError) {
    console.error('Failed to load notification_settings', settingsError)
    return Response.json({ error: settingsError.message }, { status: 500 })
  }

  if (!settingsRows || settingsRows.length === 0) {
    return Response.json({ sent: 0, users: 0 })
  }

  const userIds = settingsRows.map((r) => r.user_id)
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const [{ data: progressRows }, { data: subscriptionRows }, { data: sendRows }] = await Promise.all([
    supabase.from('progress').select('user_id, activity_by_date, timezone').in('user_id', userIds),
    supabase.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth').in('user_id', userIds),
    supabase
      .from('notification_sends')
      .select('user_id, sent_at')
      .in('user_id', userIds)
      .gte('sent_at', twoDaysAgo.toISOString()),
  ])

  const progressByUser = new Map((progressRows ?? []).map((p) => [p.user_id, p]))
  const subscriptionsByUser = new Map<string, typeof subscriptionRows>()
  for (const sub of subscriptionRows ?? []) {
    const list = subscriptionsByUser.get(sub.user_id) ?? []
    list.push(sub)
    subscriptionsByUser.set(sub.user_id, list)
  }
  const sendsByUser = new Map<string, Date[]>()
  for (const send of sendRows ?? []) {
    const list = sendsByUser.get(send.user_id) ?? []
    list.push(new Date(send.sent_at))
    sendsByUser.set(send.user_id, list)
  }

  let sentCount = 0

  for (const settings of settingsRows) {
    try {
      const subscriptions = subscriptionsByUser.get(settings.user_id) ?? []
      if (subscriptions.length === 0) continue

      const progress = progressByUser.get(settings.user_id)
      const timezone = progress?.timezone ?? 'Europe/Lisbon'
      const activityByDate = progress?.activity_by_date ?? {}
      const todayKey = localDateKey(now, timezone)
      const lessonsToday = activityByDate[todayKey]?.lessonsCompleted ?? 0

      const sendsToday = (sendsByUser.get(settings.user_id) ?? []).filter(
        (sentAt) => localDateKey(sentAt, timezone) === todayKey,
      )
      const lastSentAt = sendsToday.length
        ? new Date(Math.max(...sendsToday.map((d) => d.getTime())))
        : null

      const shouldSend = shouldSendReminder({
        lessonsToday,
        dailyGoal: settings.daily_lesson_goal,
        sendsToday: sendsToday.length,
        maxRemindersPerDay: settings.max_reminders_per_day,
        lastSentAt,
        now,
        localHour: localHourOf(now, timezone),
      })
      if (!shouldSend) continue

      const remaining = Math.max(1, settings.daily_lesson_goal - lessonsToday)
      const payload = JSON.stringify({
        title: 'tugalingo',
        body: remaining === 1 ? "You haven't done today's lesson yet 🔥" : `${remaining} lessons left today 🔥`,
      })

      let deliveredToAny = false
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          )
          deliveredToAny = true
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 404 || statusCode === 410) {
            // Subscription is gone (uninstalled, permission revoked, etc.) — clean it up.
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          } else {
            console.error(`Failed to push to user ${settings.user_id}`, err)
          }
        }
      }

      if (deliveredToAny) {
        sentCount += 1
        await supabase.from('notification_sends').insert({ user_id: settings.user_id, sent_at: now.toISOString() })
      }
    } catch (err) {
      console.error(`Failed to process reminders for user ${settings.user_id}`, err)
    }
  }

  return Response.json({ sent: sentCount, users: settingsRows.length })
})
