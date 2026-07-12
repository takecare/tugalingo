import { describe, expect, it } from 'vitest'
import { generate, isCorrect, type } from './genderMatch'

const words = [
  { id: 'cao', pt: 'cão', article: 'o', gender: 'm', emoji: '🐶', femaleForm: { article: 'a', pt: 'cadela' } },
  { id: 'gato', pt: 'gato', article: 'o', gender: 'm', emoji: '🐱', femaleForm: { article: 'a', pt: 'gata' } },
  { id: 'cavalo', pt: 'cavalo', article: 'o', gender: 'm', emoji: '🐴', femaleForm: { article: 'a', pt: 'égua' } },
  { id: 'porco', pt: 'porco', article: 'o', gender: 'm', emoji: '🐷', femaleForm: { article: 'a', pt: 'porca' } },
  // not gendered - should never be picked as a target
  { id: 'peixe', pt: 'peixe', article: 'o', gender: 'm', emoji: '🐟' },
]

const context = { words }

describe('genderMatch.generate', () => {
  it('only ever targets words that have a femaleForm', () => {
    for (let i = 0; i < 50; i++) {
      const q = generate(context)
      const target = words.find((w) => w.id === q.wordId)
      expect(target.femaleForm).toBeDefined()
    }
  })

  it('produces exactly 4 unique choices', () => {
    const q = generate(context)
    expect(q.type).toBe(type)
    expect(q.choices).toHaveLength(4)
    expect(new Set(q.choices.map((c) => c.id)).size).toBe(4)
  })

  it('the prompt sex is m or f, and the correct choice matches it', () => {
    const q = generate(context)
    expect(['m', 'f']).toContain(q.body.sex)
    const target = words.find((w) => w.id === q.wordId)
    const correctChoice = q.choices.find((c) => q.correctChoiceIds.includes(c.id))
    const expectedForm = q.body.sex === 'm' ? { article: target.article, pt: target.pt } : target.femaleForm
    expect(correctChoice.article).toBe(expectedForm.article)
    expect(correctChoice.pt).toBe(expectedForm.pt)
    expect(correctChoice.gender).toBe(q.body.sex)
  })

  it('always includes the target word\'s other-sex form as a distractor', () => {
    const q = generate(context)
    const oppositeSex = q.body.sex === 'm' ? 'f' : 'm'
    const siblingId = `${q.wordId}-${oppositeSex}`
    expect(q.choices.map((c) => c.id)).toContain(siblingId)
  })

  it('produces both sexes over many draws', () => {
    const sexes = new Set(Array.from({ length: 60 }, () => generate(context).body.sex))
    expect(sexes.has('m')).toBe(true)
    expect(sexes.has('f')).toBe(true)
  })

  it('the prompt emoji belongs to the target word', () => {
    const q = generate(context)
    const target = words.find((w) => w.id === q.wordId)
    expect([target.emoji, ...(target.emojiVariants ?? [])]).toContain(q.body.emoji)
  })

  it('respects avoidId (no consecutive repeat of the same animal)', () => {
    for (let i = 0; i < 30; i++) {
      const q = generate(context, 'cao')
      expect(q.wordId).not.toBe('cao')
    }
  })
})

describe('genderMatch.isCorrect', () => {
  it('true only for the choice marked correct, false for the sibling distractor', () => {
    const q = generate(context)
    expect(isCorrect(q, { choiceId: q.correctChoiceIds[0] })).toBe(true)
    const oppositeSex = q.body.sex === 'm' ? 'f' : 'm'
    expect(isCorrect(q, { choiceId: `${q.wordId}-${oppositeSex}` })).toBe(false)
  })
})
