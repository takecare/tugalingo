import { pickRound } from '../round'
import { pickEmoji } from '../emoji'

// The original question type: an emoji prompt, four gendered-word choices,
// one correct.
export const type = 'emoji-match'

export function generate(context, avoidWordId) {
  const { target, options } = pickRound(context.words, avoidWordId)
  return {
    id: target.id,
    type,
    wordId: target.id,
    title: 'Match the word',
    body: { emoji: pickEmoji(target) },
    choices: options.map((w) => ({ id: w.id, article: w.article, pt: w.pt, gender: w.gender })),
    correctChoiceIds: [target.id],
  }
}

export function isCorrect(question, answer) {
  return question.correctChoiceIds.includes(answer.choiceId)
}
