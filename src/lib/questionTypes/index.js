import * as emojiMatch from './emojiMatch'
import * as reverseMatch from './reverseMatch'
import * as typeIn from './typeIn'
import * as sentenceFill from './sentenceFill'
import * as compoundMatch from './compoundMatch'
import * as genderMatch from './genderMatch'
import * as phraseMatch from './phraseMatch'

// Registry of question types. Add a new module (generate + isCorrect, see
// emojiMatch.js) and register it here to make it available to lessons —
// nothing else in this file needs to change.
const registry = {
  [emojiMatch.type]: emojiMatch,
  [reverseMatch.type]: reverseMatch,
  [typeIn.type]: typeIn,
  [sentenceFill.type]: sentenceFill,
  [compoundMatch.type]: compoundMatch,
  [genderMatch.type]: genderMatch,
  [phraseMatch.type]: phraseMatch,
}

export function generateQuestion(type, context, avoidWordId) {
  return registry[type].generate(context, avoidWordId)
}

export function checkAnswer(question, answer) {
  return registry[question.type].isCorrect(question, answer)
}
