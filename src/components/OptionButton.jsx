export default function OptionButton({ option, feedback, isTarget, onClick }) {
  let className = 'option'
  if (feedback) {
    if (isTarget) className += ' option--correct'
    else if (feedback.selectedId === option.id) className += ' option--incorrect'
    else className += ' option--disabled'
  }

  return (
    <button className={className} onClick={onClick} disabled={!!feedback}>
      <span className="option__word">
        {option.article} {option.pt}
      </span>
      <span className="option__gender">{option.gender === 'f' ? '♀' : '♂'}</span>
    </button>
  )
}
