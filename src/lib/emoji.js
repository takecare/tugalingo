// Picks one emoji for a word each time it's asked, rather than always the
// same one — so e.g. a cat question sometimes shows 🐱 and sometimes 🐈. Keeps
// the player mapping word -> concept instead of word -> one specific glyph.
export function pickEmoji(word) {
  const variants = [word.emoji, ...(word.emojiVariants ?? [])]
  return variants[Math.floor(Math.random() * variants.length)]
}
