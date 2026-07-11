export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickRound(pool, avoidId) {
  const candidates = avoidId && pool.length > 1 ? pool.filter((w) => w.id !== avoidId) : pool
  const target = candidates[Math.floor(Math.random() * candidates.length)]
  const distractors = shuffle(pool.filter((w) => w.id !== target.id)).slice(0, 3)
  return { target, options: shuffle([target, ...distractors]) }
}
