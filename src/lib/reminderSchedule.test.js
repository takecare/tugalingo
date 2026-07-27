import { describe, expect, it } from 'vitest'
import { shouldSendReminder } from './reminderSchedule'

function base(overrides = {}) {
  return {
    lessonsToday: 0,
    dailyGoal: 1,
    sendsToday: 0,
    maxRemindersPerDay: 3,
    lastSentAt: null,
    now: new Date('2026-07-27T12:00:00Z'),
    localHour: 12,
    ...overrides,
  }
}

describe('shouldSendReminder', () => {
  it('sends when the goal is unmet, under the daily cap, in quiet hours, and nothing sent yet', () => {
    expect(shouldSendReminder(base())).toBe(true)
  })

  it('does not send once the daily lesson goal is met', () => {
    expect(shouldSendReminder(base({ lessonsToday: 1, dailyGoal: 1 }))).toBe(false)
  })

  it('does not send once the daily reminder cap is reached', () => {
    expect(shouldSendReminder(base({ sendsToday: 3, maxRemindersPerDay: 3 }))).toBe(false)
  })

  it('does not send before the quiet-hours window opens', () => {
    expect(shouldSendReminder(base({ localHour: 8 }))).toBe(false)
  })

  it('does not send at or after the quiet-hours window closes', () => {
    expect(shouldSendReminder(base({ localHour: 21 }))).toBe(false)
  })

  it('sends right at the window open boundary', () => {
    expect(shouldSendReminder(base({ localHour: 9 }))).toBe(true)
  })

  it('does not send again before the minimum gap between reminders has passed', () => {
    // window is 9-21 (12h), 3 reminders/day -> 4h minimum gap
    const lastSentAt = new Date('2026-07-27T10:00:00Z')
    const now = new Date('2026-07-27T12:00:00Z') // only 2h later
    expect(shouldSendReminder(base({ lastSentAt, now }))).toBe(false)
  })

  it('sends again once the minimum gap has passed', () => {
    const lastSentAt = new Date('2026-07-27T10:00:00Z')
    const now = new Date('2026-07-27T14:00:00Z') // 4h later
    expect(shouldSendReminder(base({ lastSentAt, now }))).toBe(true)
  })

  it('uses a smaller gap when more reminders are allowed per day', () => {
    // window is 9-21 (12h), 6 reminders/day -> 2h minimum gap
    const lastSentAt = new Date('2026-07-27T10:00:00Z')
    const now = new Date('2026-07-27T12:00:00Z') // 2h later
    expect(shouldSendReminder(base({ maxRemindersPerDay: 6, lastSentAt, now }))).toBe(true)
  })
})
