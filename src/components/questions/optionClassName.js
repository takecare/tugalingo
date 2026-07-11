// Shared feedback-state class logic for any button-based choice, so
// OptionButton and the newer question renderers stay visually consistent
// (green/red/disabled) without depending on each other.
export function optionClassName({ isTarget, isSelected, hasFeedback }, base = 'option') {
  let className = base
  if (hasFeedback) {
    if (isTarget) className += ` ${base}--correct`
    else if (isSelected) className += ` ${base}--incorrect`
    else className += ` ${base}--disabled`
  }
  return className
}
