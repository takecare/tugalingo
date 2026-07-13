import { describe, expect, it } from 'vitest'
import {
  activeQuestionTypes,
  buildLessonContext,
  currentCompoundPool,
  currentPhrasePool,
  currentVerbPool,
  currentWordPool,
  pickQuestionType,
} from './lessons'

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

describe('word/verb/compound pools ramp with level', () => {
  it('level-2 content is excluded before LEVEL_2_UNLOCK_AFTER, included after', () => {
    const early = currentWordPool(progressWithHistory(0))
    const later = currentWordPool(progressWithHistory(3))

    expect(early.every((w) => w.level === 1)).toBe(true)
    expect(later.some((w) => w.level === 2)).toBe(true)
    expect(later.length).toBeGreaterThan(early.length)
  })

  it('applies the same ramp to verbs, compounds, and phrases', () => {
    const earlyVerbs = currentVerbPool(progressWithHistory(0))
    const laterVerbs = currentVerbPool(progressWithHistory(3))
    expect(laterVerbs.length).toBeGreaterThanOrEqual(earlyVerbs.length)

    const earlyCompounds = currentCompoundPool(progressWithHistory(0))
    const laterCompounds = currentCompoundPool(progressWithHistory(3))
    expect(laterCompounds.length).toBeGreaterThanOrEqual(earlyCompounds.length)

    const earlyPhrases = currentPhrasePool(progressWithHistory(0))
    const laterPhrases = currentPhrasePool(progressWithHistory(3))
    expect(laterPhrases.length).toBeGreaterThanOrEqual(earlyPhrases.length)
  })
})

describe('buildLessonContext', () => {
  it('bundles words, verbs, compounds, and phrases together', () => {
    const context = buildLessonContext(progressWithHistory(5))
    expect(context).toHaveProperty('words')
    expect(context).toHaveProperty('verbs')
    expect(context).toHaveProperty('compounds')
    expect(context).toHaveProperty('phrases')
    expect(context.words.length).toBeGreaterThan(0)
  })
})
