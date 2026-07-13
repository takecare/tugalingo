import { describe, expect, it } from 'vitest'
import words from '../../data/words.json'
import verbs from '../../data/verbs.json'
import compounds from '../../data/compounds.json'
import phrases from '../../data/phrases.json'
import { checkAnswer, generateQuestion } from './index'

const context = { words, verbs, compounds, phrases }

const allTypes = [
  'emoji-match',
  'reverse-match',
  'compound-match',
  'type-in',
  'gender-match',
  'phrase-match',
  'sentence-fill',
]

describe('generateQuestion + checkAnswer', () => {
  it.each(allTypes)('dispatches %s to the right module and round-trips a correct answer', (type) => {
    const q = generateQuestion(type, context)
    expect(q.type).toBe(type)

    if (type === 'type-in') {
      expect(checkAnswer(q, { text: q.correctText })).toBe(true)
    } else {
      expect(checkAnswer(q, { choiceId: q.correctChoiceIds[0] })).toBe(true)
    }
  })

  it('uses the real word/verb/compound banks without throwing', () => {
    for (const type of allTypes) {
      expect(() => generateQuestion(type, context)).not.toThrow()
    }
  })
})
