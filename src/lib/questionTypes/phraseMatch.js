import { shuffle } from '../round'

// A conversational cue as the prompt (an emoji plus a short Portuguese
// question/exclamation), and the player picks the natural reply from four
// choices — see docs/design.md#question-types. Unlike emoji-match, the
// prompt itself is a full phrase, not a single concept.
export const type = 'phrase-match'

function pickTarget(pool, avoidId) {
  const candidates = avoidId && pool.length > 1 ? pool.filter((p) => p.id !== avoidId) : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function generate(context, avoidId) {
  const target = pickTarget(context.phrases, avoidId)
  const distractors = shuffle(context.phrases.filter((p) => p.id !== target.id)).slice(0, 3)
  const choicePhrases = shuffle([target, ...distractors])

  return {
    id: target.id,
    type,
    wordId: target.id,
    title: 'Pick the reply',
    body: { emoji: target.emoji, prompt: target.prompt },
    choices: choicePhrases.map((p) => ({ id: p.id, label: p.reply })),
    correctChoiceIds: [target.id],
  }
}

export function isCorrect(question, answer) {
  return question.correctChoiceIds.includes(answer.choiceId)
}
