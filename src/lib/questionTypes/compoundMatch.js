import { shuffle } from '../round'

// A prompt made of *multiple* emojis together rather than one, for concepts
// that only exist as a combination (see docs/design.md#question-types) —
// e.g. ☕ + 🥛🥛 is "galão", not "coffee" and "milk" separately.
export const type = 'compound-match'

function pickTarget(pool, avoidId) {
  const candidates = avoidId && pool.length > 1 ? pool.filter((c) => c.id !== avoidId) : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function generate(context, avoidId) {
  const target = pickTarget(context.compounds, avoidId)
  const distractors = shuffle(context.compounds.filter((c) => c.id !== target.id)).slice(0, 3)
  const options = shuffle([target, ...distractors])

  return {
    id: target.id,
    type,
    wordId: target.id,
    title: 'What is this?',
    body: { emojis: target.emojis },
    choices: options.map((c) => ({ id: c.id, article: c.article, pt: c.pt, gender: c.gender })),
    correctChoiceIds: [target.id],
  }
}

export function isCorrect(question, answer) {
  return question.correctChoiceIds.includes(answer.choiceId)
}
