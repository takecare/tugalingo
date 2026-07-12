import { describe, expect, it } from 'vitest'
import { generate, isCorrect, type } from './compoundMatch'

const compounds = [
  { id: 'galao', pt: 'galão', article: 'o', gender: 'm', emojis: ['☕', '🥛', '🥛'] },
  { id: 'meia-de-leite', pt: 'meia de leite', article: 'a', gender: 'f', emojis: ['☕', '🥛'] },
  { id: 'sumo-de-laranja', pt: 'sumo de laranja', article: 'o', gender: 'm', emojis: ['🍊', '🧃'] },
  { id: 'pao-com-manteiga', pt: 'pão com manteiga', article: 'o', gender: 'm', emojis: ['🍞', '🧈'] },
]

const context = { compounds }

describe('compoundMatch.generate', () => {
  it('prompts with the target\'s full emoji sequence and 4 word choices', () => {
    const q = generate(context)
    expect(q.type).toBe(type)
    const target = compounds.find((c) => c.id === q.wordId)
    expect(q.body.emojis).toEqual(target.emojis)
    expect(q.choices).toHaveLength(4)
  })

  it('the correct choice matches the target compound', () => {
    const q = generate(context)
    const target = compounds.find((c) => c.id === q.wordId)
    const correctChoice = q.choices.find((c) => q.correctChoiceIds.includes(c.id))
    expect(correctChoice).toEqual({ id: target.id, article: target.article, pt: target.pt, gender: target.gender })
  })

  it('respects avoidId', () => {
    for (let i = 0; i < 30; i++) {
      const q = generate(context, 'galao')
      expect(q.wordId).not.toBe('galao')
    }
  })
})

describe('compoundMatch.isCorrect', () => {
  it('matches only the correct choice id', () => {
    const q = generate(context)
    expect(isCorrect(q, { choiceId: q.correctChoiceIds[0] })).toBe(true)
    const wrongId = q.choices.map((c) => c.id).find((id) => id !== q.correctChoiceIds[0])
    expect(isCorrect(q, { choiceId: wrongId })).toBe(false)
  })
})
