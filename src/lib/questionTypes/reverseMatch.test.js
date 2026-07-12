import { describe, expect, it } from 'vitest'
import { generate, isCorrect, type } from './reverseMatch'

const words = [
  { id: 'maca', pt: 'maçã', article: 'a', gender: 'f', emoji: '🍎', emojiVariants: ['🍏'] },
  { id: 'banana', pt: 'banana', article: 'a', gender: 'f', emoji: '🍌' },
  { id: 'pao', pt: 'pão', article: 'o', gender: 'm', emoji: '🍞' },
  { id: 'queijo', pt: 'queijo', article: 'o', gender: 'm', emoji: '🧀' },
  { id: 'ovo', pt: 'ovo', article: 'o', gender: 'm', emoji: '🥚' },
]

const context = { words }

describe('reverseMatch.generate', () => {
  it('prompts with the word and offers 4 emoji choices', () => {
    const q = generate(context)
    expect(q.type).toBe(type)
    const target = words.find((w) => w.id === q.wordId)
    expect(q.body).toEqual({ article: target.article, pt: target.pt, gender: target.gender })
    expect(q.choices).toHaveLength(4)
    expect(q.choices.every((c) => typeof c.emoji === 'string')).toBe(true)
  })

  it('the correct choice id matches the target, with an emoji among its valid variants', () => {
    const q = generate(context)
    const target = words.find((w) => w.id === q.wordId)
    const correctChoice = q.choices.find((c) => q.correctChoiceIds.includes(c.id))
    expect(correctChoice.id).toBe(target.id)
    expect([target.emoji, ...(target.emojiVariants ?? [])]).toContain(correctChoice.emoji)
  })
})

describe('reverseMatch.isCorrect', () => {
  it('true only for the target word id', () => {
    const q = generate(context)
    expect(isCorrect(q, { choiceId: q.wordId })).toBe(true)
    const wrongId = q.choices.map((c) => c.id).find((id) => id !== q.wordId)
    expect(isCorrect(q, { choiceId: wrongId })).toBe(false)
  })
})
