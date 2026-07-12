import { describe, expect, it } from 'vitest'
import { pickEmoji } from './emoji'

describe('pickEmoji', () => {
  it('returns the base emoji when there are no variants', () => {
    expect(pickEmoji({ emoji: '🐻' })).toBe('🐻')
  })

  it('only ever returns the base emoji or one of its variants', () => {
    const word = { emoji: '🐱', emojiVariants: ['🐈'] }
    const seen = new Set()
    for (let i = 0; i < 100; i++) {
      seen.add(pickEmoji(word))
    }
    expect([...seen].sort()).toEqual(['🐈', '🐱'])
  })

  it('eventually returns every variant given enough draws', () => {
    const word = { emoji: '🍎', emojiVariants: ['🍏'] }
    const seen = new Set(Array.from({ length: 50 }, () => pickEmoji(word)))
    expect(seen.has('🍎')).toBe(true)
    expect(seen.has('🍏')).toBe(true)
  })
})
