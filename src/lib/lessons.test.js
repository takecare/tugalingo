import { describe, expect, it } from 'vitest'
import words from '../data/words.json'
import verbs from '../data/verbs.json'
import compounds from '../data/compounds.json'
import phrases from '../data/phrases.json'
import {
  ALL_QUESTION_TYPES,
  activeQuestionTypes,
  buildDebugLessonContext,
  buildLessonContext,
  currentCompoundPool,
  currentPhrasePool,
  currentVerbPool,
  currentWordPool,
  pickQuestionType,
} from './lessons'

// The real content banks, used purely as realistic fixture data here — same
// role src/data/*.json plays in questionTypes/index.test.js. The app itself
// loads this from Supabase at runtime now (see src/lib/contentStore.js).
const content = { words, verbs, compounds, phrases }

function progressWithHistory(n) {
  return { history: Array.from({ length: n }, () => ({ completedAt: '', correct: 10, total: 10 })), activityByDate: {} }
}

describe('pickQuestionType', () => {
  it('only ever returns one of the given types', () => {
    const types = ['emoji-match', 'reverse-match']
    for (let i = 0; i < 50; i++) {
      expect(types).toContain(pickQuestionType(types))
    }
  })
})

describe('activeQuestionTypes', () => {
  it('only emoji-match is active for a brand new player', () => {
    expect(activeQuestionTypes(progressWithHistory(0))).toEqual(['emoji-match'])
  })

  it('unlocks types in order as history grows, and never loses an earlier one', () => {
    const seenAt2 = activeQuestionTypes(progressWithHistory(2))
    const seenAt4 = activeQuestionTypes(progressWithHistory(4))
    const seenAt8 = activeQuestionTypes(progressWithHistory(8))

    expect(seenAt2).toEqual(['emoji-match', 'reverse-match'])
    expect(seenAt4).toEqual(['emoji-match', 'reverse-match', 'phrase-match', 'compound-match'])
    expect(seenAt8).toContain('gender-match')
    expect(seenAt8).toContain('sentence-fill')

    // monotonic: everything unlocked earlier is still unlocked later
    for (const type of seenAt2) expect(seenAt4).toContain(type)
    for (const type of seenAt4) expect(seenAt8).toContain(type)
  })

  it('all seven types are unlocked by lesson 8', () => {
    expect(activeQuestionTypes(progressWithHistory(8))).toHaveLength(7)
  })
})

describe('ALL_QUESTION_TYPES', () => {
  it('lists every type, matching what eventually unlocks for a real player', () => {
    expect(ALL_QUESTION_TYPES).toEqual(activeQuestionTypes(progressWithHistory(8)))
  })
})

describe('word/verb/compound pools ramp with level', () => {
  it('level-2 content is excluded before LEVEL_2_UNLOCK_AFTER, included after', () => {
    const early = currentWordPool(content, progressWithHistory(0))
    const later = currentWordPool(content, progressWithHistory(3))

    expect(early.every((w) => w.level === 1)).toBe(true)
    expect(later.some((w) => w.level === 2)).toBe(true)
    expect(later.length).toBeGreaterThan(early.length)
  })

  it('applies the same ramp to verbs, compounds, and phrases', () => {
    const earlyVerbs = currentVerbPool(content, progressWithHistory(0))
    const laterVerbs = currentVerbPool(content, progressWithHistory(3))
    expect(laterVerbs.length).toBeGreaterThanOrEqual(earlyVerbs.length)

    const earlyCompounds = currentCompoundPool(content, progressWithHistory(0))
    const laterCompounds = currentCompoundPool(content, progressWithHistory(3))
    expect(laterCompounds.length).toBeGreaterThanOrEqual(earlyCompounds.length)

    const earlyPhrases = currentPhrasePool(content, progressWithHistory(0))
    const laterPhrases = currentPhrasePool(content, progressWithHistory(3))
    expect(laterPhrases.length).toBeGreaterThanOrEqual(earlyPhrases.length)
  })
})

describe('buildLessonContext', () => {
  it('bundles words, verbs, compounds, and phrases together', () => {
    const context = buildLessonContext(content, progressWithHistory(5))
    expect(context).toHaveProperty('words')
    expect(context).toHaveProperty('verbs')
    expect(context).toHaveProperty('compounds')
    expect(context).toHaveProperty('phrases')
    expect(context.words.length).toBeGreaterThan(0)
  })
})

describe('buildDebugLessonContext', () => {
  it('always returns the fully-unlocked (level 2) pool, regardless of real progress', () => {
    const debugContext = buildDebugLessonContext(content)
    const fullyProgressedContext = buildLessonContext(content, progressWithHistory(10))

    expect(debugContext.words).toEqual(fullyProgressedContext.words)
    expect(debugContext.verbs).toEqual(fullyProgressedContext.verbs)
    expect(debugContext.compounds).toEqual(fullyProgressedContext.compounds)
    expect(debugContext.phrases).toEqual(fullyProgressedContext.phrases)
  })
})
