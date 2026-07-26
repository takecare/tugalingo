import { describe, expect, it } from 'vitest'
import { parseLocalProgress } from './localProgress'

describe('parseLocalProgress', () => {
  it('returns the progress when it is well-formed and non-empty', () => {
    const valid = {
      history: [{ completedAt: '2026-07-11T00:00:00.000Z', correct: 9, total: 10 }],
      activityByDate: { '2026-07-11': { lessonsCompleted: 1 } },
    }
    expect(parseLocalProgress(JSON.stringify(valid))).toEqual(valid)
  })

  it('returns null when there is nothing stored', () => {
    expect(parseLocalProgress(null)).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseLocalProgress('not json{')).toBeNull()
  })

  it('returns null for well-formed JSON that is not a progress object', () => {
    expect(parseLocalProgress(JSON.stringify({ not: 'progress' }))).toBeNull()
  })

  it('returns null for a genuinely empty history', () => {
    const empty = { history: [], activityByDate: {} }
    expect(parseLocalProgress(JSON.stringify(empty))).toBeNull()
  })
})
