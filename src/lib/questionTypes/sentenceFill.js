import { shuffle } from '../round'

// Verb conjugation, the one thing emoji-match structurally can't represent
// (see docs/design.md#question-types): an emoji sets the scene, a pronoun is
// shown as text, and the player picks the matching conjugated form from
// distractors drawn from the *other persons of the same verb* — that's the
// actual skill being tested (subject-verb agreement), not vocab recall.
export const type = 'sentence-fill'

export function generate(context, avoidVerbId) {
  const candidates =
    avoidVerbId && context.verbs.length > 1 ? context.verbs.filter((v) => v.id !== avoidVerbId) : context.verbs
  const verb = candidates[Math.floor(Math.random() * candidates.length)]

  const persons = Object.keys(verb.conjugations)
  const correctPerson = persons[Math.floor(Math.random() * persons.length)]
  const distractorPersons = shuffle(persons.filter((p) => p !== correctPerson)).slice(0, 3)
  const choicePersons = shuffle([correctPerson, ...distractorPersons])
  const correctChoiceId = `${verb.id}-${correctPerson}`

  return {
    id: correctChoiceId,
    type,
    wordId: verb.id,
    title: 'Fill in the blank',
    body: { emoji: verb.emoji, pronoun: verb.conjugations[correctPerson].pronoun },
    choices: choicePersons.map((p) => ({ id: `${verb.id}-${p}`, label: verb.conjugations[p].form })),
    correctChoiceIds: [correctChoiceId],
  }
}

export function isCorrect(question, answer) {
  return question.correctChoiceIds.includes(answer.choiceId)
}
