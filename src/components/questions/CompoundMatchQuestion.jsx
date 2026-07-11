import OptionButton from '../OptionButton'

export default function CompoundMatchQuestion({ question, feedback, onAnswer }) {
  const buttonFeedback = feedback ? { correct: feedback.correct, selectedId: feedback.answer.choiceId } : null

  return (
    <>
      <div className="compound-display">
        {question.body.emojis.map((emoji, i) => (
          <span className="compound-display__emoji" key={i}>
            {emoji}
          </span>
        ))}
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
