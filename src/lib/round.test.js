import { describe, expect, it } from 'vitest'
import { pickRound, shuffle } from './round'

describe('shuffle', () => {
  it('does not mutate the original array', () => {
    const original = [1, 2, 3, 4, 5]
    const copy = [...original]
    shuffle(original)
    expect(original).toEqual(copy)
  })

  it('returns an array with the same elements', () => {
    const original = ['a', 'b', 'c', 'd']
    const result = shuffle(original)
    expect(result).toHaveLength(original.length)
    expect(result.slice().sort()).toEqual(original.slice().sort())
  })
})

describe('pickRound', () => {
  const pool = [
    { id: 'a' },
    { id: 'b' },
    { id: 'c' },
    { id: 'd' },
    { id: 'e' },
  ]

  it('returns a target plus exactly 4 options (target + 3 distractors)', () => {
    const { target, options } = pickRound(pool)
    expect(options).toHaveLength(4)
    expect(options.map((o) => o.id)).toContain(target.id)
  })

  it('options are always unique', () => {
    for (let i = 0; i < 50; i++) {
      const { options } = pickRound(pool)
      const ids = options.map((o) => o.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('never picks avoidId as the target when other options exist', () => {
    for (let i = 0; i < 50; i++) {
      const { target } = pickRound(pool, 'a')
      expect(target.id).not.toBe('a')
    }
  })

  it('falls back to the full pool if avoidId would leave nothing to pick', () => {
    const singleton = [{ id: 'only' }]
    const { target } = pickRound(singleton, 'only')
    expect(target.id).toBe('only')
  })
})
