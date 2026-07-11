import words from '../data/words.json'

export const BASE_QUESTIONS = 10
export const EXTEND_THRESHOLD = 9
// keyed by correct-count out of the first 10 questions
export const EXTENDED_TOTAL = { 9: 12, 10: 14 }

// First few lessons stick to level-1 words only; from lesson 4 on, the full
// pool is in play. Adding more `level` tiers to words.json extends the ramp.
export function levelCapForLesson(lessonNumber) {
  return lessonNumber <= 3 ? 1 : 2
}

export function poolForLesson(lessonNumber) {
  const cap = levelCapForLesson(lessonNumber)
  return words.filter((w) => w.level <= cap)
}

// The next lesson number that hasn't been completed yet — also the highest
// unlocked lesson, since lesson N unlocks once lesson N-1 is completed.
export function nextUnlockedLesson(progress) {
  let n = 1
  while (progress.lessons[String(n)]) n++
  return n
}
