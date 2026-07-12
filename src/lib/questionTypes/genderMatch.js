import { shuffle } from '../round'
import { pickEmoji } from '../emoji'

// Some animal words have a genuinely different form for each sex, not just a
// different article (o cão / a cadela, o gato / a gata) — see
// docs/design.md#question-types. The prompt is the emoji plus a ♂/♀ symbol;
// the player has to know which of the word's two forms matches the symbol
// shown, not just recognize the animal.
export const type = 'gender-match'

function genderedPool(context) {
  return context.words.filter((w) => w.femaleForm)
}

function pickTarget(pool, avoidId) {
  const candidates = avoidId && pool.length > 1 ? pool.filter((w) => w.id !== avoidId) : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function choiceFor(word, sex) {
  const form = sex === 'm' ? { article: word.article, pt: word.pt } : word.femaleForm
  return { id: `${word.id}-${sex}`, article: form.article, pt: form.pt, gender: sex }
}

export function generate(context, avoidId) {
  const pool = genderedPool(context)
  const target = pickTarget(pool, avoidId)
  const sex = Math.random() < 0.5 ? 'm' : 'f'
  const correct = choiceFor(target, sex)
  // The word's *other* form is always one of the options — the whole point
  // is testing whether the player knows which form goes with which symbol,
  // not just which animal this is.
  const sibling = choiceFor(target, sex === 'm' ? 'f' : 'm')

  const others = shuffle(pool.filter((w) => w.id !== target.id)).slice(0, 2)
  const otherChoices = others.map((w) => choiceFor(w, Math.random() < 0.5 ? 'm' : 'f'))

  const options = shuffle([correct, sibling, ...otherChoices])

  return {
    id: `${target.id}-${sex}`,
    type,
    wordId: target.id,
    body: { emoji: pickEmoji(target), sex },
    choices: options,
    correctChoiceIds: [correct.id],
  }
}

export function isCorrect(question, answer) {
  return question.correctChoiceIds.includes(answer.choiceId)
}
