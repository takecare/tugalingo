import { pickRound } from '../round'
import { pickEmoji } from '../emoji'

// The mirror of emoji-match: the Portuguese word is the prompt, the four
// choices are emoji. Tests recall (word -> meaning) instead of recognition
// (meaning -> word), so it's unlocked a little later than emoji-match.
export const type = 'reverse-match'

export function generate(context, avoidWordId) {
  const { target, options } = pickRound(context.words, avoidWordId)
  return {
    id: target.id,
    type,
    wordId: target.id,
    title: 'Pick the right emoji',
    body: { article: target.article, pt: target.pt, gender: target.gender },
    choices: options.map((w) => ({ id: w.id, emoji: pickEmoji(w) })),
    correctChoiceIds: [target.id],
  }
}

export function isCorrect(question, answer) {
  return question.correctChoiceIds.includes(answer.choiceId)
}
