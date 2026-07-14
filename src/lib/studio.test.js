import { describe, expect, it } from 'vitest'
import { BANKS, PERSONS, draftToEntry, emptyDraft, entryToDraft, validateEntry } from './studio'

describe('emptyDraft', () => {
  it.each(BANKS)('returns a blank draft for %s with no id', (bank) => {
    const draft = emptyDraft(bank)
    expect(draft.id).toBe('')
  })

  it('defaults level to 1 for every bank', () => {
    for (const bank of BANKS) {
      expect(emptyDraft(bank).level).toBe(1)
    }
  })
})

describe('draftToEntry / entryToDraft round-trip', () => {
  it('words: a plain word round-trips exactly', () => {
    const draft = {
      ...emptyDraft('words'),
      id: 'cavalo',
      pt: 'cavalo',
      en: 'horse',
      article: 'o',
      gender: 'm',
      emoji: '🐴',
      emojiVariants: '🐎',
      category: 'animals',
      level: 1,
    }
    const entry = draftToEntry('words', draft)
    expect(entry).toEqual({
      id: 'cavalo',
      pt: 'cavalo',
      en: 'horse',
      article: 'o',
      gender: 'm',
      emoji: '🐴',
      emojiVariants: ['🐎'],
      category: 'animals',
      level: 1,
    })
    expect(entryToDraft('words', entry)).toEqual(draft)
  })

  it('words: omits emojiVariants/femaleForm entirely when not set (matches existing data style)', () => {
    const draft = { ...emptyDraft('words'), id: 'porco', pt: 'porco', en: 'pig', emoji: '🐷' }
    const entry = draftToEntry('words', draft)
    expect(entry).not.toHaveProperty('emojiVariants')
    expect(entry).not.toHaveProperty('femaleForm')
  })

  it('words: includes femaleForm only when the checkbox is on and a word is given', () => {
    const draft = {
      ...emptyDraft('words'),
      id: 'cao',
      pt: 'cão',
      en: 'dog',
      emoji: '🐶',
      hasFemaleForm: true,
      femaleArticle: 'a',
      femalePt: 'cadela',
    }
    const entry = draftToEntry('words', draft)
    expect(entry.femaleForm).toEqual({ article: 'a', pt: 'cadela' })

    const draftUnchecked = { ...draft, hasFemaleForm: false }
    expect(draftToEntry('words', draftUnchecked)).not.toHaveProperty('femaleForm')

    const draftCheckedButEmpty = { ...draft, femalePt: '' }
    expect(draftToEntry('words', draftCheckedButEmpty)).not.toHaveProperty('femaleForm')
  })

  it('verbs: round-trips all 5 conjugations with fixed pronouns', () => {
    const draft = {
      ...emptyDraft('verbs'),
      id: 'correr',
      en: 'to run',
      emoji: '🏃',
      level: 1,
      conjugations: { eu: 'corro', tu: 'corres', ele_ela: 'corre', nos: 'corremos', eles_elas: 'correm' },
    }
    const entry = draftToEntry('verbs', draft)
    expect(entry.conjugations).toEqual({
      eu: { pronoun: 'Eu', form: 'corro' },
      tu: { pronoun: 'Tu', form: 'corres' },
      ele_ela: { pronoun: 'Ele/Ela', form: 'corre' },
      nos: { pronoun: 'Nós', form: 'corremos' },
      eles_elas: { pronoun: 'Eles/Elas', form: 'correm' },
    })
    expect(entryToDraft('verbs', entry)).toEqual(draft)
  })

  it('compounds: emoji sequence is a space-separated string in the draft, an array in the entry', () => {
    const draft = {
      ...emptyDraft('compounds'),
      id: 'galao',
      pt: 'galão',
      en: 'coffee with a lot of milk',
      emojis: '☕ 🥛 🥛',
    }
    const entry = draftToEntry('compounds', draft)
    expect(entry.emojis).toEqual(['☕', '🥛', '🥛'])
    expect(entryToDraft('compounds', entry).emojis).toBe('☕ 🥛 🥛')
  })

  it('phrases: round-trips prompt/reply', () => {
    const draft = { ...emptyDraft('phrases'), id: 'obrigado', emoji: '🙏', prompt: 'Obrigado!', reply: 'De nada!' }
    const entry = draftToEntry('phrases', draft)
    expect(entry).toEqual({ id: 'obrigado', emoji: '🙏', prompt: 'Obrigado!', reply: 'De nada!', level: 1 })
    expect(entryToDraft('phrases', entry)).toEqual(draft)
  })

  it('trims whitespace from text fields', () => {
    const draft = { ...emptyDraft('phrases'), id: '  obrigado  ', emoji: ' 🙏 ', prompt: ' Obrigado! ', reply: ' De nada! ' }
    const entry = draftToEntry('phrases', draft)
    expect(entry).toEqual({ id: 'obrigado', emoji: '🙏', prompt: 'Obrigado!', reply: 'De nada!', level: 1 })
  })
})

describe('validateEntry', () => {
  const existing = [{ id: 'gato', level: 1 }]

  it('requires an id', () => {
    const entry = draftToEntry('phrases', { ...emptyDraft('phrases'), emoji: '🙂', prompt: 'a', reply: 'b' })
    expect(validateEntry('phrases', entry, existing)).toContain('ID is required.')
  })

  it('rejects ids with invalid characters', () => {
    const entry = draftToEntry('phrases', {
      ...emptyDraft('phrases'),
      id: 'Como Estás',
      emoji: '🙂',
      prompt: 'a',
      reply: 'b',
    })
    expect(validateEntry('phrases', entry, existing).some((e) => e.includes('lowercase'))).toBe(true)
  })

  it('rejects a duplicate id against a different entry', () => {
    const entry = draftToEntry('words', { ...emptyDraft('words'), id: 'gato', pt: 'gato', en: 'cat', emoji: '🐱' })
    expect(validateEntry('words', entry, existing).some((e) => e.includes('already exists'))).toBe(true)
  })

  it('allows saving an entry under its own id when editing', () => {
    const entry = draftToEntry('words', { ...emptyDraft('words'), id: 'gato', pt: 'gato', en: 'cat', emoji: '🐱' })
    expect(validateEntry('words', entry, existing, 'gato')).toEqual([])
  })

  it('requires every conjugation for verbs', () => {
    const draft = {
      ...emptyDraft('verbs'),
      id: 'correr',
      en: 'to run',
      emoji: '🏃',
      conjugations: { eu: 'corro', tu: '', ele_ela: 'corre', nos: 'corremos', eles_elas: 'correm' },
    }
    const entry = draftToEntry('verbs', draft)
    const errors = validateEntry('verbs', entry, [])
    expect(errors.some((e) => e.includes('Tu'))).toBe(true)
  })

  it('requires at least one emoji for compounds', () => {
    const entry = draftToEntry('compounds', {
      ...emptyDraft('compounds'),
      id: 'galao',
      pt: 'galão',
      en: 'coffee with milk',
      emojis: '',
    })
    expect(validateEntry('compounds', entry, []).some((e) => e.includes('emoji'))).toBe(true)
  })

  it('a fully valid new entry has no errors', () => {
    const entry = draftToEntry('words', {
      ...emptyDraft('words'),
      id: 'novo',
      pt: 'novo',
      en: 'new',
      emoji: '✨',
    })
    expect(validateEntry('words', entry, existing)).toEqual([])
  })
})

describe('PERSONS', () => {
  it('has exactly the 5 persons used by the real verb bank', () => {
    expect(PERSONS.map((p) => p.key)).toEqual(['eu', 'tu', 'ele_ela', 'nos', 'eles_elas'])
  })
})
