import words from '../data/words.json'
import verbs from '../data/verbs.json'
import compounds from '../data/compounds.json'

export const BASE_QUESTIONS = 10
export const EXTEND_THRESHOLD = 9
// keyed by correct-count out of the first 10 questions
export const EXTENDED_TOTAL = { 9: 12, 10: 14 }

// Fallback list used by Lesson.jsx when no explicit questionTypes prop is
// passed (e.g. in isolation/tests). The app itself always passes
// activeQuestionTypes(progress) instead, so this only needs the type that's
// safe from question one.
export const DEFAULT_QUESTION_TYPES = ['emoji-match']

export function pickQuestionType(types) {
  return types[Math.floor(Math.random() * types.length)]
}

// Question types unlock gradually rather than all mixing in from lesson one:
// reverse-match and type-in are harder variants of the same recognition
// skill, compound-match introduces new (small) content, and sentence-fill
// (verb conjugation) is a different skill altogether that's easiest to take
// on once basic vocab is comfortable. Keyed off completed-lesson count, same
// signal as the word-level ramp below.
const QUESTION_TYPE_UNLOCKS = [
  { type: 'emoji-match', after: 0 },
  { type: 'reverse-match', after: 2 },
  { type: 'compound-match', after: 4 },
  { type: 'type-in', after: 5 },
  { type: 'sentence-fill', after: 8 },
]

export function activeQuestionTypes(progress) {
  const n = progress.history.length
  return QUESTION_TYPE_UNLOCKS.filter((u) => n >= u.after).map((u) => u.type)
}

// The first few lessons ever played stick to level-1 words only; after that,
// the full pool is in play. Adding more `level` tiers to words.json extends
// the ramp further.
const LEVEL_2_UNLOCK_AFTER = 3

export function currentWordPool(progress) {
  const cap = progress.history.length < LEVEL_2_UNLOCK_AFTER ? 1 : 2
  return words.filter((w) => w.level <= cap)
}

export function currentVerbPool(progress) {
  const cap = progress.history.length < LEVEL_2_UNLOCK_AFTER ? 1 : 2
  return verbs.filter((v) => v.level <= cap)
}

export function currentCompoundPool(progress) {
  const cap = progress.history.length < LEVEL_2_UNLOCK_AFTER ? 1 : 2
  return compounds.filter((c) => c.level <= cap)
}

// Bundles every content pool a question type might draw from. Adding a
// question type that needs a new kind of content (e.g. a sentence corpus)
// means adding one more named field here — generate(context, avoidId)
// implementations just read whichever field(s) they need.
export function buildLessonContext(progress) {
  return {
    words: currentWordPool(progress),
    verbs: currentVerbPool(progress),
    compounds: currentCompoundPool(progress),
  }
}
