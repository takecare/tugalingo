import { optionClassName } from './optionClassName'

export default function ReverseMatchQuestion({ question, feedback, onAnswer }) {
  const selectedId = feedback?.answer.choiceId

  return (
    <>
      <div className="word-display">
        <span className="word-display__word">
          {question.body.article} {question.body.pt}
        </span>
        <span className="word-display__gender">{question.body.gender === 'f' ? '♀' : '♂'}</span>
      </div>
      <div className="options">
        {question.choices.map((choice) => {
          const isTarget = question.correctChoiceIds.includes(choice.id)
          const className = optionClassName({
            isTarget,
            isSelected: selectedId === choice.id,
            hasFeedback: !!feedback,
          })
          return (
            <button
              key={choice.id}
              className={`${className} option--emoji`}
              disabled={!!feedback}
              onClick={() => onAnswer({ type: question.type, choiceId: choice.id })}
            >
              {choice.emoji}
            </button>
          )
        })}
      </div>
    </>
  )
}
