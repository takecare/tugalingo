import { describe, expect, it } from 'vitest'
import { generate, isCorrect, type } from './phraseMatch'

const phrases = [
  { id: 'como-estas', emoji: '🙂', prompt: 'Como estás?', reply: 'Bem, obrigado.' },
  { id: 'obrigado', emoji: '🙏', prompt: 'Obrigado!', reply: 'De nada!' },
  { id: 'como-te-chamas', emoji: '🙋', prompt: 'Como te chamas?', reply: 'Chamo-me Ana.' },
  { id: 'quanto-custa', emoji: '💰', prompt: 'Quanto custa?', reply: 'Custa dez euros.' },
]

const context = { phrases }

describe('phraseMatch.generate', () => {
  it('prompts with the target\'s emoji and phrase, and 4 reply choices', () => {
    const q = generate(context)
    expect(q.type).toBe(type)
    const target = phrases.find((p) => p.id === q.wordId)
    expect(q.body).toEqual({ emoji: target.emoji, prompt: target.prompt })
    expect(q.choices).toHaveLength(4)
  })

  it('the correct choice is the target\'s own reply', () => {
    const q = generate(context)
    const target = phrases.find((p) => p.id === q.wordId)
    const correctChoice = q.choices.find((c) => q.correctChoiceIds.includes(c.id))
    expect(correctChoice).toEqual({ id: target.id, label: target.reply })
  })

  it('distractor replies belong to other phrases, not the target', () => {
    const q = generate(context)
    const wrongChoices = q.choices.filter((c) => !q.correctChoiceIds.includes(c.id))
    for (const choice of wrongChoices) {
      expect(choice.id).not.toBe(q.wordId)
      const owner = phrases.find((p) => p.id === choice.id)
      expect(choice.label).toBe(owner.reply)
    }
  })

  it('respects avoidId (no consecutive repeat)', () => {
    for (let i = 0; i < 30; i++) {
      const q = generate(context, 'como-estas')
      expect(q.wordId).not.toBe('como-estas')
    }
  })
})

describe('phraseMatch.isCorrect', () => {
  it('true only for the correct choice', () => {
    const q = generate(context)
    expect(isCorrect(q, { choiceId: q.correctChoiceIds[0] })).toBe(true)
    const wrongId = q.choices.map((c) => c.id).find((id) => id !== q.correctChoiceIds[0])
    expect(isCorrect(q, { choiceId: wrongId })).toBe(false)
  })
})
