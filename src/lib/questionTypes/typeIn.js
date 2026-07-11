import { pickEmoji } from '../emoji'

// Free-text production instead of picking from choices: an emoji prompt, the
// player types the Portuguese word. No `choices`/`correctChoiceIds` — the
// answer is checked against `correctText` instead.
export const type = 'type-in'

function pickTarget(pool, avoidWordId) {
  const candidates = avoidWordId && pool.length > 1 ? pool.filter((w) => w.id !== avoidWordId) : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

// Accent-insensitive: a beginner typing on a keyboard without easy access to
// ã/ç/õ shouldn't be marked wrong for the accent alone, only for the word.
function normalize(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function generate(context, avoidWordId) {
  const target = pickTarget(context.words, avoidWordId)
  return {
    id: target.id,
    type,
    wordId: target.id,
    title: 'Type the word',
    body: { emoji: pickEmoji(target) },
    choices: [],
    correctChoiceIds: [],
    correctText: target.pt,
  }
}

export function isCorrect(question, answer) {
  return normalize(answer.text ?? '') === normalize(question.correctText)
}
