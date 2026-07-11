import { useEffect, useMemo, useState } from 'react'
import words from '../data/words.json'
import { useProgress } from '../hooks/useProgress'
import { pickRound } from '../lib/round'
import OptionButton from './OptionButton'

const UNLOCK_THRESHOLD = 8
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'animals', label: 'Animals' },
]

export default function Game() {
  const { progress, recordAnswer } = useProgress()
  const level = progress.totalCorrect >= UNLOCK_THRESHOLD ? 2 : 1
  const [category, setCategory] = useState('all')
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [round, setRound] = useState(null)

  const pool = useMemo(
    () => words.filter((w) => w.level <= level && (category === 'all' || w.category === category)),
    [level, category],
  )

  useEffect(() => {
    setRound(pickRound(pool))
    setFeedback(null)
  }, [pool])

  if (!round) return null

  function handleChoice(option) {
    if (feedback) return
    const correct = option.id === round.target.id
    const newStreak = correct ? streak + 1 : 0
    setStreak(newStreak)
    recordAnswer(correct, newStreak)
    setFeedback({ correct, selectedId: option.id })
    setTimeout(() => {
      setRound(pickRound(pool, round.target.id))
      setFeedback(null)
    }, 900)
  }

  const remainingToUnlock = UNLOCK_THRESHOLD - progress.totalCorrect

  return (
    <div className="game">
      <div className="hud">
        <div className="category-picker">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={c.id === category ? 'category-picker__btn category-picker__btn--active' : 'category-picker__btn'}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="stats">
          <span title="Current streak">🔥 {streak}</span>
          <span title="Best streak">🏆 {progress.bestStreak}</span>
          <span title="Total correct">✅ {progress.totalCorrect}</span>
        </div>
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

      {level === 1 && remainingToUnlock > 0 && (
        <p className="hint">Get {remainingToUnlock} more correct to unlock level 2 words</p>
      )}
    </div>
  )
}
