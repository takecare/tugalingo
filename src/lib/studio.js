// Pure logic for the content studio (see src/components/Studio.jsx): the
// form draft <-> data-file entry shape conversion, and validation, for each
// content bank. Kept separate from the studio component and from
// src/lib/studioFile.js (the actual File System Access API calls) so this
// part is plain and unit-testable, same as everything else under src/lib/.

export const BANKS = ['words', 'verbs', 'compounds', 'phrases']

export const PERSONS = [
  { key: 'eu', pronoun: 'Eu' },
  { key: 'tu', pronoun: 'Tu' },
  { key: 'ele_ela', pronoun: 'Ele/Ela' },
  { key: 'nos', pronoun: 'Nós' },
  { key: 'eles_elas', pronoun: 'Eles/Elas' },
]

export function emptyDraft(bank) {
  switch (bank) {
    case 'words':
      return {
        id: '',
        pt: '',
        en: '',
        article: 'o',
        gender: 'm',
        emoji: '',
        emojiVariants: '',
        category: 'food',
        level: 1,
        hasFemaleForm: false,
        femaleArticle: 'a',
        femalePt: '',
      }
    case 'verbs':
      return {
        id: '',
        en: '',
        emoji: '',
        level: 1,
        conjugations: Object.fromEntries(PERSONS.map((p) => [p.key, ''])),
      }
    case 'compounds':
      return { id: '', pt: '', en: '', article: 'o', gender: 'm', emojis: '', level: 1 }
    case 'phrases':
      return { id: '', emoji: '', prompt: '', reply: '', level: 1 }
    default:
      throw new Error(`Unknown bank: ${bank}`)
  }
}

// Draft -> the shape actually written to the data file.
export function draftToEntry(bank, draft) {
  switch (bank) {
    case 'words': {
      const entry = {
        id: draft.id.trim(),
        pt: draft.pt.trim(),
        en: draft.en.trim(),
        article: draft.article,
        gender: draft.gender,
        emoji: draft.emoji.trim(),
        category: draft.category,
        level: Number(draft.level),
      }
      const variants = draft.emojiVariants.trim().split(/\s+/).filter(Boolean)
      if (variants.length) entry.emojiVariants = variants
      if (draft.hasFemaleForm && draft.femalePt.trim()) {
        entry.femaleForm = { article: draft.femaleArticle, pt: draft.femalePt.trim() }
      }
      return entry
    }
    case 'verbs': {
      const conjugations = Object.fromEntries(
        PERSONS.map((p) => [p.key, { pronoun: p.pronoun, form: draft.conjugations[p.key].trim() }]),
      )
      return {
        id: draft.id.trim(),
        en: draft.en.trim(),
        emoji: draft.emoji.trim(),
        level: Number(draft.level),
        conjugations,
      }
    }
    case 'compounds':
      return {
        id: draft.id.trim(),
        pt: draft.pt.trim(),
        en: draft.en.trim(),
        article: draft.article,
        gender: draft.gender,
        emojis: draft.emojis.trim().split(/\s+/).filter(Boolean),
        level: Number(draft.level),
      }
    case 'phrases':
      return {
        id: draft.id.trim(),
        emoji: draft.emoji.trim(),
        prompt: draft.prompt.trim(),
        reply: draft.reply.trim(),
        level: Number(draft.level),
      }
    default:
      throw new Error(`Unknown bank: ${bank}`)
  }
}

// The inverse of draftToEntry — loading an existing entry back into the form
// for editing.
export function entryToDraft(bank, entry) {
  switch (bank) {
    case 'words':
      return {
        id: entry.id,
        pt: entry.pt,
        en: entry.en,
        article: entry.article,
        gender: entry.gender,
        emoji: entry.emoji,
        emojiVariants: (entry.emojiVariants ?? []).join(' '),
        category: entry.category,
        level: entry.level,
        hasFemaleForm: !!entry.femaleForm,
        femaleArticle: entry.femaleForm?.article ?? 'a',
        femalePt: entry.femaleForm?.pt ?? '',
      }
    case 'verbs':
      return {
        id: entry.id,
        en: entry.en,
        emoji: entry.emoji,
        level: entry.level,
        conjugations: Object.fromEntries(PERSONS.map((p) => [p.key, entry.conjugations[p.key].form])),
      }
    case 'compounds':
      return {
        id: entry.id,
        pt: entry.pt,
        en: entry.en,
        article: entry.article,
        gender: entry.gender,
        emojis: entry.emojis.join(' '),
        level: entry.level,
      }
    case 'phrases':
      return { id: entry.id, emoji: entry.emoji, prompt: entry.prompt, reply: entry.reply, level: entry.level }
    default:
      throw new Error(`Unknown bank: ${bank}`)
  }
}

// entry is the already-converted (draftToEntry) shape. editingId is the id
// of the entry being edited (excluded from the duplicate-id check against
// itself), or null when adding a new one.
export function validateEntry(bank, entry, existingEntries, editingId = null) {
  const errors = []

  if (!entry.id) errors.push('ID is required.')
  else if (!/^[a-z0-9-]+$/.test(entry.id)) errors.push('ID should be lowercase letters, numbers, and hyphens only.')
  else if (existingEntries.some((e) => e.id === entry.id && e.id !== editingId)) {
    errors.push(`An entry with id "${entry.id}" already exists.`)
  }

  if (![1, 2].includes(entry.level)) errors.push('Level must be 1 or 2.')

  switch (bank) {
    case 'words':
      if (!entry.pt) errors.push('Portuguese word is required.')
      if (!entry.en) errors.push('English translation is required.')
      if (!entry.emoji) errors.push('Emoji is required.')
      break
    case 'verbs':
      if (!entry.en) errors.push('English translation is required.')
      if (!entry.emoji) errors.push('Emoji is required.')
      for (const p of PERSONS) {
        if (!entry.conjugations[p.key].form) errors.push(`Conjugation for "${p.pronoun}" is required.`)
      }
      break
    case 'compounds':
      if (!entry.pt) errors.push('Portuguese phrase is required.')
      if (!entry.en) errors.push('English gloss is required.')
      if (!entry.emojis.length) errors.push('At least one emoji is required.')
      break
    case 'phrases':
      if (!entry.prompt) errors.push('Prompt is required.')
      if (!entry.reply) errors.push('Reply is required.')
      if (!entry.emoji) errors.push('Emoji is required.')
      break
    default:
      throw new Error(`Unknown bank: ${bank}`)
  }

  return errors
}
