import { describe, expect, it } from 'vitest'
import { currentStreak, dateKey, recentDays } from './dates'

describe('dateKey', () => {
  it('formats as YYYY-MM-DD with zero-padding', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(dateKey(new Date(2026, 10, 23))).toBe('2026-11-23')
  })
})

describe('recentDays', () => {
  it('returns n days ending at endDate, oldest first', () => {
    const end = new Date(2026, 6, 12) // Sun 2026-07-12
    const days = recentDays(5, end)
    expect(days.map(dateKey)).toEqual([
      '2026-07-08',
      '2026-07-09',
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
    ])
  })

  it('the last entry is always endDate itself', () => {
    const end = new Date(2026, 6, 12)
    const days = recentDays(30, end)
    expect(dateKey(days[days.length - 1])).toBe(dateKey(end))
    expect(days).toHaveLength(30)
  })
})

describe('currentStreak', () => {
  function activity(dateKeys) {
    return Object.fromEntries(dateKeys.map((k) => [k, { lessonsCompleted: 1 }]))
  }

  it('is 0 with no activity at all', () => {
    expect(currentStreak({}, new Date(2026, 6, 12))).toBe(0)
  })

  it('counts consecutive days ending today when today has activity', () => {
    const today = new Date(2026, 6, 12)
    const data = activity(['2026-07-10', '2026-07-11', '2026-07-12'])
    expect(currentStreak(data, today)).toBe(3)
  })

  it('still counts yesterday\'s streak as alive if today has no activity yet', () => {
    const today = new Date(2026, 6, 12)
    const data = activity(['2026-07-10', '2026-07-11'])
    expect(currentStreak(data, today)).toBe(2)
  })

  it('stops counting at the first gap, ignoring older activity beyond it', () => {
    const today = new Date(2026, 6, 12)
    // gap on the 10th: yesterday (11th) still counts, but the 9th doesn't
    const data = activity(['2026-07-09', '2026-07-11'])
    expect(currentStreak(data, today)).toBe(1)
  })

  it('is 0 when neither today nor yesterday have activity, even with older activity', () => {
    const today = new Date(2026, 6, 12)
    const data = activity(['2026-07-01'])
    expect(currentStreak(data, today)).toBe(0)
  })

  it('ignores a completed day if a more recent day was skipped', () => {
    const today = new Date(2026, 6, 12)
    // today done, yesterday skipped, day before done -> streak is just today (1)
    const data = activity(['2026-07-10', '2026-07-12'])
    expect(currentStreak(data, today)).toBe(1)
  })
})
