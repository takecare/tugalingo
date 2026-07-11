import words from '../data/words.json'

export const BASE_QUESTIONS = 10
export const EXTEND_THRESHOLD = 9
// keyed by correct-count out of the first 10 questions
export const EXTENDED_TOTAL = { 9: 12, 10: 14 }

// The first few lessons ever played stick to level-1 words only; after that,
// the full pool is in play. Adding more `level` tiers to words.json extends
// the ramp further.
const LEVEL_2_UNLOCK_AFTER = 3

export function currentWordPool(progress) {
  const cap = progress.history.length < LEVEL_2_UNLOCK_AFTER ? 1 : 2
  return words.filter((w) => w.level <= cap)
}
