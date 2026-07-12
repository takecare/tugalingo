import OptionButton from '../OptionButton'

export default function GenderMatchQuestion({ question, feedback, onAnswer }) {
  const buttonFeedback = feedback ? { correct: feedback.correct, selectedId: feedback.answer.choiceId } : null

  return (
    <>
      <div className="gender-match-display">
        <span className="gender-match-display__emoji">{question.body.emoji}</span>
        <span className={`gender-match-display__symbol gender-match-display__symbol--${question.body.sex}`}>
          {question.body.sex === 'm' ? '♂' : '♀'}
        </span>
      </div>
      <div className="options">
        {question.choices.map((choice) => (
          <OptionButton
            key={choice.id}
            option={choice}
            feedback={buttonFeedback}
            isTarget={question.correctChoiceIds.includes(choice.id)}
            onClick={() => onAnswer({ type: question.type, choiceId: choice.id })}
          />
        ))}
      </div>
    </>
  )
}
