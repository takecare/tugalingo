export default function LessonResults({ result, isNewBest, streak, onContinue }) {
  const { correct, total } = result
  const pct = Math.round((correct / total) * 100)
  const extended = total > 10

  return (
    <div className="lesson-results">
      <h2>Lesson complete</h2>
      <p className="lesson-results__score">
        {correct} / {total} correct ({pct}%)
      </p>
      {extended && (
        <p className="lesson-results__note">
          You extended this lesson to {total} questions by scoring well on the first 10.
        </p>
      )}
      {isNewBest && <p className="lesson-results__note">🏆 New best score!</p>}
      <p className="lesson-results__streak">🔥 {streak} day streak</p>
      <button className="lesson-results__continue" onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}
