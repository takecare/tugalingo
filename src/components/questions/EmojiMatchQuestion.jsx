import OptionButton from '../OptionButton'

export default function EmojiMatchQuestion({ question, feedback, onAnswer }) {
  const buttonFeedback = feedback ? { correct: feedback.correct, selectedId: feedback.answer.choiceId } : null

  return (
    <>
      <div className="emoji-display">{question.body.emoji}</div>
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
