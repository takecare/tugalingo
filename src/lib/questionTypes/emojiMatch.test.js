import { describe, expect, it } from 'vitest'
import { generate, isCorrect, type } from './emojiMatch'

const words = [
  { id: 'maca', pt: 'maçã', article: 'a', gender: 'f', emoji: '🍎' },
  { id: 'banana', pt: 'banana', article: 'a', gender: 'f', emoji: '🍌' },
  { id: 'pao', pt: 'pão', article: 'o', gender: 'm', emoji: '🍞' },
  { id: 'queijo', pt: 'queijo', article: 'o', gender: 'm', emoji: '🧀' },
  { id: 'ovo', pt: 'ovo', article: 'o', gender: 'm', emoji: '🥚' },
]

const context = { words }

describe('emojiMatch.generate', () => {
  it('produces 4 choices including exactly one correct one', () => {
    const q = generate(context)
    expect(q.type).toBe(type)
    expect(q.choices).toHaveLength(4)
    expect(q.correctChoiceIds).toHaveLength(1)
    const correct = q.choices.filter((c) => q.correctChoiceIds.includes(c.id))
    expect(correct).toHaveLength(1)
  })

  it('the correct choice matches the target word data', () => {
    const q = generate(context)
    const target = words.find((w) => w.id === q.wordId)
    const correctChoice = q.choices.find((c) => q.correctChoiceIds.includes(c.id))
    expect(correctChoice.article).toBe(target.article)
    expect(correctChoice.pt).toBe(target.pt)
    expect(correctChoice.gender).toBe(target.gender)
  })

  it('the prompt emoji is one of the target word\'s valid emoji', () => {
    const q = generate(context)
    const target = words.find((w) => w.id === q.wordId)
    expect([target.emoji, ...(target.emojiVariants ?? [])]).toContain(q.body.emoji)
  })

  it('respects avoidWordId (no consecutive repeat when alternatives exist)', () => {
    for (let i = 0; i < 30; i++) {
      const q = generate(context, 'maca')
      expect(q.wordId).not.toBe('maca')
    }
  })
})

describe('emojiMatch.isCorrect', () => {
  it('true for the correct choice, false otherwise', () => {
    const q = generate(context)
    expect(isCorrect(q, { choiceId: q.correctChoiceIds[0] })).toBe(true)
    const wrongId = q.choices.map((c) => c.id).find((id) => id !== q.correctChoiceIds[0])
    expect(isCorrect(q, { choiceId: wrongId })).toBe(false)
  })
})
