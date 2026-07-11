import { useState } from 'react'
import { BASE_QUESTIONS, EXTEND_THRESHOLD, EXTENDED_TOTAL } from '../lib/lessons'
import { pickRound } from '../lib/round'
import OptionButton from './OptionButton'

export default function Lesson({ pool, onComplete, onExit }) {
  const [index, setIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(BASE_QUESTIONS)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [round, setRound] = useState(() => pickRound(pool))
  const [feedback, setFeedback] = useState(null)

  function handleChoice(option) {
    if (feedback) return
    const correct = option.id === round.target.id
    const newCorrectCount = correct ? correctCount + 1 : correctCount
    setCorrectCount(newCorrectCount)
    setStreak(correct ? streak + 1 : 0)
    setFeedback({ correct, selectedId: option.id })

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
      setRound(pickRound(pool, round.target.id))
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
            style={{ width: `${(index / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="lesson__streak" title="Current streak">
          🔥 {streak}
        </span>
      </div>

      <div className="emoji-display">{round.target.emoji}</div>

      <div className="options">
        {round.options.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            feedback={feedback}
            isTarget={option.id === round.target.id}
            onClick={() => handleChoice(option)}
          />
        ))}
      </div>
    </div>
  )
}
