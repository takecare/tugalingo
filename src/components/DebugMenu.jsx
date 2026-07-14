import { ALL_QUESTION_TYPES } from '../lib/lessons'

function labelFor(type) {
  return type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function DebugMenu({ onSelectType, onBack }) {
  return (
    <div className="debug-menu">
      <button className="icon-exit-button" onClick={onBack}>
        ✕
      </button>
      <h2>Debug: pick a question type</h2>
      <div className="debug-menu__list">
        {ALL_QUESTION_TYPES.map((type) => (
          <button key={type} className="debug-menu__item" onClick={() => onSelectType(type)}>
            {labelFor(type)}
          </button>
        ))}
      </div>
    </div>
  )
}
