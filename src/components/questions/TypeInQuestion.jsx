import { useState } from 'react'

export default function TypeInQuestion({ question, feedback, onAnswer }) {
  const [value, setValue] = useState('')

  function submit() {
    if (feedback || !value.trim()) return
    onAnswer({ type: question.type, text: value })
  }

  let inputClassName = 'type-in__input'
  if (feedback) inputClassName += feedback.correct ? ' type-in__input--correct' : ' type-in__input--incorrect'

  return (
    <>
      <div className="emoji-display">{question.body.emoji}</div>
      <div className="type-in">
        <input
          type="text"
          className={inputClassName}
          value={value}
          disabled={!!feedback}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder="Type the word..."
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button className="type-in__submit" onClick={submit} disabled={!!feedback || !value.trim()}>
          Check
        </button>
      </div>
      {feedback && !feedback.correct && (
        <p className="type-in__answer">Correct answer: {question.correctText}</p>
      )}
    </>
  )
}
