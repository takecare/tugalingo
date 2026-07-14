import { describe, expect, it } from 'vitest'
import { previewQuestionFor } from './studioPreview'

describe('previewQuestionFor: words', () => {
  const pool = [
    { id: 'gato', pt: 'gato', article: 'o', gender: 'm', emoji: '🐱' },
    { id: 'banana', pt: 'banana', article: 'a', gender: 'f', emoji: '🍌' },
    { id: 'pao', pt: 'pão', article: 'o', gender: 'm', emoji: '🍞' },
  ]

  it('previews a plain word as emoji-match, target included in choices', () => {
    const entry = { id: 'cavalo', pt: 'cavalo', article: 'o', gender: 'm', emoji: '🐴' }
    const q = previewQuestionFor('words', entry, pool)
    expect(q.type).toBe('emoji-match')
    expect(q.body.emoji).toBe('🐴')
    expect(q.correctChoiceIds).toEqual(['cavalo'])
    expect(q.choices.map((c) => c.id)).toContain('cavalo')
  })

  it('previews a word with a femaleForm as gender-match, sibling included as a distractor', () => {
    const entry = { id: 'cao', pt: 'cão', article: 'o', gender: 'm', emoji: '🐶', femaleForm: { article: 'a', pt: 'cadela' } }
    const q = previewQuestionFor('words', entry, pool)
    expect(q.type).toBe('gender-match')
    expect(q.body.sex).toBe('f')
    const correct = q.choices.find((c) => q.correctChoiceIds.includes(c.id))
    expect(correct).toEqual({ id: 'cao-f', article: 'a', pt: 'cadela', gender: 'f' })
    expect(q.choices.map((c) => c.id)).toContain('cao-m')
  })
})

describe('previewQuestionFor: verbs', () => {
  it('previews as sentence-fill with a pronoun matching the correct choice', () => {
    const entry = {
      id: 'falar',
      emoji: '🗣️',
      conjugations: {
        eu: { pronoun: 'Eu', form: 'falo' },
        tu: { pronoun: 'Tu', form: 'falas' },
        ele_ela: { pronoun: 'Ele/Ela', form: 'fala' },
        nos: { pronoun: 'Nós', form: 'falamos' },
        eles_elas: { pronoun: 'Eles/Elas', form: 'falam' },
      },
    }
    const q = previewQuestionFor('verbs', entry, [])
    expect(q.type).toBe('sentence-fill')
    const correctPerson = q.correctChoiceIds[0].slice(entry.id.length + 1)
    expect(q.body.pronoun).toBe(entry.conjugations[correctPerson].pronoun)
    expect(q.choices.every((c) => Object.values(entry.conjugations).some((cj) => cj.form === c.label))).toBe(true)
  })
})

describe('previewQuestionFor: compounds', () => {
  it('previews as compound-match with the full emoji sequence', () => {
    const entry = { id: 'galao', pt: 'galão', article: 'o', gender: 'm', emojis: ['☕', '🥛', '🥛'] }
    const q = previewQuestionFor('compounds', entry, [])
    expect(q.type).toBe('compound-match')
    expect(q.body.emojis).toEqual(['☕', '🥛', '🥛'])
    expect(q.correctChoiceIds).toEqual(['galao'])
  })
})

describe('previewQuestionFor: phrases', () => {
  it('previews as phrase-match with the reply as the correct choice label', () => {
    const entry = { id: 'obrigado', emoji: '🙏', prompt: 'Obrigado!', reply: 'De nada!' }
    const q = previewQuestionFor('phrases', entry, [])
    expect(q.type).toBe('phrase-match')
    const correct = q.choices.find((c) => q.correctChoiceIds.includes(c.id))
    expect(correct.label).toBe('De nada!')
  })
})
