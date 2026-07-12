import { describe, expect, it } from 'vitest'
import { generate, isCorrect, type } from './typeIn'

const words = [
  { id: 'maca', pt: 'maçã', article: 'a', gender: 'f', emoji: '🍎' },
  { id: 'banana', pt: 'banana', article: 'a', gender: 'f', emoji: '🍌' },
  { id: 'pao', pt: 'pão', article: 'o', gender: 'm', emoji: '🍞' },
]

const context = { words }

describe('typeIn.generate', () => {
  it('has no choices, only correctText', () => {
    const q = generate(context)
    expect(q.type).toBe(type)
    expect(q.choices).toEqual([])
    expect(q.correctChoiceIds).toEqual([])
    const target = words.find((w) => w.id === q.wordId)
    expect(q.correctText).toBe(target.pt)
  })
})

describe('typeIn.isCorrect', () => {
  const question = { correctText: 'maçã' }

  it('accepts an exact match', () => {
    expect(isCorrect(question, { text: 'maçã' })).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isCorrect(question, { text: 'MAÇÃ' })).toBe(true)
  })

  it('is accent-insensitive, so a missing ã is still accepted', () => {
    expect(isCorrect(question, { text: 'maca' })).toBe(true)
  })

  it('ignores surrounding whitespace', () => {
    expect(isCorrect(question, { text: '  maçã  ' })).toBe(true)
  })

  it('rejects a genuinely wrong word', () => {
    expect(isCorrect(question, { text: 'banana' })).toBe(false)
  })

  it('rejects an empty answer', () => {
    expect(isCorrect(question, { text: '' })).toBe(false)
  })
})
