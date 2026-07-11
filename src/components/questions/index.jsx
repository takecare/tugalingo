import EmojiMatchQuestion from './EmojiMatchQuestion'
import ReverseMatchQuestion from './ReverseMatchQuestion'
import TypeInQuestion from './TypeInQuestion'
import SentenceFillQuestion from './SentenceFillQuestion'
import CompoundMatchQuestion from './CompoundMatchQuestion'

// Registry of question renderers, keyed by question type. Add a new
// component (see EmojiMatchQuestion.jsx for the props contract: question,
// feedback, onAnswer) and register it here — Lesson.jsx never needs to know
// about specific question types.
const registry = {
  'emoji-match': EmojiMatchQuestion,
  'reverse-match': ReverseMatchQuestion,
  'type-in': TypeInQuestion,
  'sentence-fill': SentenceFillQuestion,
  'compound-match': CompoundMatchQuestion,
}

export default function QuestionRenderer({ question, feedback, onAnswer }) {
  const Component = registry[question.type]
  // Keyed on question.id so any question-local state (e.g. TypeInQuestion's
  // text input) resets on every new question, even across two questions of
  // the same type back-to-back.
  return <Component key={question.id} question={question} feedback={feedback} onAnswer={onAnswer} />
}
