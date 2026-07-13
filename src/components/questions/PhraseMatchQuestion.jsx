import { optionClassName } from './optionClassName'

export default function PhraseMatchQuestion({ question, feedback, onAnswer }) {
  const selectedId = feedback?.answer.choiceId

  return (
    <>
      <div className="phrase-display">
        <span className="phrase-display__emoji">{question.body.emoji}</span>
        <p className="phrase-display__prompt">{question.body.prompt}</p>
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
              className={`${className} option--word`}
              disabled={!!feedback}
              onClick={() => onAnswer({ type: question.type, choiceId: choice.id })}
            >
              {choice.label}
            </button>
          )
        })}
      </div>
    </>
  )
}
