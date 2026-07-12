import { useRef, useState } from 'react'
import {
  BASE_QUESTIONS,
  EXTEND_THRESHOLD,
  EXTENDED_TOTAL,
  DEFAULT_QUESTION_TYPES,
  pickQuestionType,
} from '../lib/lessons'
import { generateQuestion, checkAnswer } from '../lib/questionTypes'
import QuestionRenderer from './questions'

export default function Lesson({ context, questionTypes = DEFAULT_QUESTION_TYPES, onComplete, onExit }) {
  const [index, setIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(BASE_QUESTIONS)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [question, setQuestion] = useState(() => generateQuestion(pickQuestionType(questionTypes), context))
  const [feedback, setFeedback] = useState(null)

  // A lesson extending past 10 questions grows the denominator, which would
  // otherwise make the bar visibly jump backwards (e.g. 10/10 -> 10/12).
  // Track the highest fraction shown so far so it only ever holds or grows.
  const maxProgressRef = useRef(0)
  maxProgressRef.current = Math.max(maxProgressRef.current, index / totalQuestions)

  function handleAnswer(answer) {
    if (feedback) return
    const correct = checkAnswer(question, answer)
    const newCorrectCount = correct ? correctCount + 1 : correctCount
    setCorrectCount(newCorrectCount)
    setStreak(correct ? streak + 1 : 0)
    setFeedback({ correct, answer })

    setTimeout(() => {
      const nextIndex = index + 1
      let total = totalQuestions
      if (nextIndex === BASE_QUESTIONS && newCorrectCount >= EXTEND_THRESHOLD) {
        total = EXTENDED_TOTAL[newCorrectCount]
        setTotalQuestions(total)
      }
      if (nextIndex >= total) {
        onComplete({ correct: newCorrectCount, total })
        return
      }
      setIndex(nextIndex)
      setQuestion(generateQuestion(pickQuestionType(questionTypes), context, question.wordId))
      setFeedback(null)
    }, 900)
  }

  return (
    <div className="lesson">
      <div className="lesson__hud">
        <button className="lesson__exit" onClick={onExit} aria-label="Exit lesson">
          ✕
        </button>
        <div className="lesson__progress-bar">
          <div
            className="lesson__progress-fill"
            style={{ width: `${maxProgressRef.current * 100}%` }}
          />
        </div>
        <span className="lesson__streak" title="Current streak">
          🔥 {streak}
        </span>
      </div>

      <div className="question-enter" key={index}>
        <QuestionRenderer question={question} feedback={feedback} onAnswer={handleAnswer} />
      </div>
    </div>
  )
}
