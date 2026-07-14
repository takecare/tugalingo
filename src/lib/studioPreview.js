// Builds a real Question object (the same shape src/lib/questionTypes/
// produces) for whatever's currently in the studio's form, so the preview
// panel can hand it straight to the actual <QuestionRenderer /> — no
// separate preview-only rendering code to keep in sync with the real thing.
// Each bank previews as its "primary" question type; distractors are drawn
// from whatever else is currently loaded, same distractor logic as the real
// generate() functions, just with a forced (not random) target.
import { shuffle } from './round'
import { pickEmoji } from './emoji'

function otherChoices(pool, exceptId, count) {
  return shuffle(pool.filter((e) => e.id !== exceptId)).slice(0, count)
}

function previewWordQuestion(entry, pool) {
  if (entry.femaleForm) {
    const correct = { id: `${entry.id}-f`, article: entry.femaleForm.article, pt: entry.femaleForm.pt, gender: 'f' }
    const sibling = { id: `${entry.id}-m`, article: entry.article, pt: entry.pt, gender: 'm' }
    const genderedPool = pool.filter((w) => w.femaleForm && w.id !== entry.id)
    const others = shuffle(genderedPool)
      .slice(0, 2)
      .map((w) =>
        Math.random() < 0.5
          ? { id: `${w.id}-m`, article: w.article, pt: w.pt, gender: 'm' }
          : { id: `${w.id}-f`, article: w.femaleForm.article, pt: w.femaleForm.pt, gender: 'f' },
      )
    return {
      id: `${entry.id}-f`,
      type: 'gender-match',
      wordId: entry.id,
      body: { emoji: pickEmoji(entry), sex: 'f' },
      choices: shuffle([correct, sibling, ...others]),
      correctChoiceIds: [correct.id],
    }
  }

  const distractors = otherChoices(pool, entry.id, 3)
  const options = shuffle([entry, ...distractors])
  return {
    id: entry.id,
    type: 'emoji-match',
    wordId: entry.id,
    body: { emoji: pickEmoji(entry) },
    choices: options.map((w) => ({ id: w.id, article: w.article, pt: w.pt, gender: w.gender })),
    correctChoiceIds: [entry.id],
  }
}

function previewVerbQuestion(entry) {
  const persons = Object.keys(entry.conjugations)
  const correctPerson = persons[Math.floor(Math.random() * persons.length)]
  const distractorPersons = shuffle(persons.filter((p) => p !== correctPerson)).slice(0, 3)
  const choicePersons = shuffle([correctPerson, ...distractorPersons])
  const correctChoiceId = `${entry.id}-${correctPerson}`
  return {
    id: correctChoiceId,
    type: 'sentence-fill',
    wordId: entry.id,
    body: { emoji: entry.emoji, pronoun: entry.conjugations[correctPerson].pronoun },
    choices: choicePersons.map((p) => ({ id: `${entry.id}-${p}`, label: entry.conjugations[p].form })),
    correctChoiceIds: [correctChoiceId],
  }
}

function previewCompoundQuestion(entry, pool) {
  const distractors = otherChoices(pool, entry.id, 3)
  const options = shuffle([entry, ...distractors])
  return {
    id: entry.id,
    type: 'compound-match',
    wordId: entry.id,
    body: { emojis: entry.emojis },
    choices: options.map((c) => ({ id: c.id, article: c.article, pt: c.pt, gender: c.gender })),
    correctChoiceIds: [entry.id],
  }
}

function previewPhraseQuestion(entry, pool) {
  const distractors = otherChoices(pool, entry.id, 3)
  const choicePhrases = shuffle([entry, ...distractors])
  return {
    id: entry.id,
    type: 'phrase-match',
    wordId: entry.id,
    body: { emoji: entry.emoji, prompt: entry.prompt },
    choices: choicePhrases.map((p) => ({ id: p.id, label: p.reply })),
    correctChoiceIds: [entry.id],
  }
}

export function previewQuestionFor(bank, entry, pool) {
  switch (bank) {
    case 'words':
      return previewWordQuestion(entry, pool)
    case 'verbs':
      return previewVerbQuestion(entry)
    case 'compounds':
      return previewCompoundQuestion(entry, pool)
    case 'phrases':
      return previewPhraseQuestion(entry, pool)
    default:
      return null
  }
}
