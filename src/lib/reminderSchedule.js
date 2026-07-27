// Decides whether a lesson-reminder push notification should go out right
// now, given a user's settings and how many they've already had today. Pure
// so it's unit-testable — the caller (send-lesson-reminders edge function)
// resolves timezone-aware values (localHour, lastSentAt, sendsToday) before
// calling in. Mirrored (not imported, different runtime) in
// supabase/functions/send-lesson-reminders/index.ts — keep both in sync.

// Reminders only fire in this local-hour window, so nobody gets buzzed at
// 3am just because they haven't hit their goal yet.
export const QUIET_HOURS_START = 9 // inclusive
export const QUIET_HOURS_END = 21 // exclusive

export function shouldSendReminder({
  lessonsToday,
  dailyGoal,
  sendsToday,
  maxRemindersPerDay,
  lastSentAt, // Date | null — most recent send today, if any
  now, // Date — current instant
  localHour, // 0-23, current hour in the user's timezone
  quietHoursStart = QUIET_HOURS_START,
  quietHoursEnd = QUIET_HOURS_END,
}) {
  if (lessonsToday >= dailyGoal) return false
  if (sendsToday >= maxRemindersPerDay) return false
  if (localHour < quietHoursStart || localHour >= quietHoursEnd) return false

  // Spread the allowed reminders evenly across the waking window instead of
  // firing them in a burst the moment the window opens.
  const windowMs = (quietHoursEnd - quietHoursStart) * 60 * 60 * 1000
  const minGapMs = windowMs / maxRemindersPerDay
  if (lastSentAt && now.getTime() - lastSentAt.getTime() < minGapMs) return false

  return true
}
