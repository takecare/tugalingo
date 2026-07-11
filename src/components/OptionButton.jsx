import { optionClassName } from './questions/optionClassName'

export default function OptionButton({ option, feedback, isTarget, onClick }) {
  const className = optionClassName({
    isTarget,
    isSelected: feedback?.selectedId === option.id,
    hasFeedback: !!feedback,
  })

  return (
    <button className={className} onClick={onClick} disabled={!!feedback}>
      <span className="option__word">
        {option.article} {option.pt}
      </span>
      <span className="option__gender">{option.gender === 'f' ? '♀' : '♂'}</span>
    </button>
  )
}
