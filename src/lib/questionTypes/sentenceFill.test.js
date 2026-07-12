import { describe, expect, it } from 'vitest'
import { generate, isCorrect, type } from './sentenceFill'

const verbs = [
  {
    id: 'falar',
    emoji: '🗣️',
    conjugations: {
      eu: { pronoun: 'Eu', form: 'falo' },
      tu: { pronoun: 'Tu', form: 'falas' },
      ele_ela: { pronoun: 'Ele/Ela', form: 'fala' },
      nos: { pronoun: 'Nós', form: 'falamos' },
      eles_elas: { pronoun: 'Eles/Elas', form: 'falam' },
    },
  },
  {
    id: 'comprar',
    emoji: '🛍️',
    conjugations: {
      eu: { pronoun: 'Eu', form: 'compro' },
      tu: { pronoun: 'Tu', form: 'compras' },
      ele_ela: { pronoun: 'Ele/Ela', form: 'compra' },
      nos: { pronoun: 'Nós', form: 'compramos' },
      eles_elas: { pronoun: 'Eles/Elas', form: 'compram' },
    },
  },
]

const context = { verbs }

describe('sentenceFill.generate', () => {
  it('produces 4 choices, all conjugations of the same verb', () => {
    const q = generate(context)
    expect(q.type).toBe(type)
    expect(q.choices).toHaveLength(4)
    expect(q.choices.every((c) => c.id.startsWith(`${q.wordId}-`))).toBe(true)
  })

  it('the pronoun in the prompt matches the correct choice\'s person', () => {
    const q = generate(context)
    const verb = verbs.find((v) => v.id === q.wordId)
    const correctChoice = q.choices.find((c) => q.correctChoiceIds.includes(c.id))
    const correctPerson = correctChoice.id.slice(q.wordId.length + 1)
    expect(q.body.pronoun).toBe(verb.conjugations[correctPerson].pronoun)
    expect(correctChoice.label).toBe(verb.conjugations[correctPerson].form)
  })

  it('distractors are other persons of the same verb, not a different verb', () => {
    const q = generate(context)
    const verb = verbs.find((v) => v.id === q.wordId)
    const validForms = Object.values(verb.conjugations).map((c) => c.form)
    expect(q.choices.every((c) => validForms.includes(c.label))).toBe(true)
  })

  it('respects avoidVerbId', () => {
    for (let i = 0; i < 30; i++) {
      const q = generate(context, 'falar')
      expect(q.wordId).not.toBe('falar')
    }
  })
})

describe('sentenceFill.isCorrect', () => {
  it('matches only the correct choice id', () => {
    const q = generate(context)
    expect(isCorrect(q, { choiceId: q.correctChoiceIds[0] })).toBe(true)
    const wrongId = q.choices.map((c) => c.id).find((id) => id !== q.correctChoiceIds[0])
    expect(isCorrect(q, { choiceId: wrongId })).toBe(false)
  })
})
