# Data model

There are two pieces of data in the app: the static word bank, and the player's persisted progress.

## Word bank — `src/data/words.json`

An array of word entries. Each entry:

| Field | Type | Example | Notes |
|---|---|---|---|
| `id` | string | `"maca"` | Stable, unique, ASCII (used as React key and to avoid repeating the same word twice in a row). |
| `pt` | string | `"maçã"` | The Portuguese word, European Portuguese spelling. |
| `en` | string | `"apple"` | English translation — not shown in-game currently, kept for a possible future hint or a different game mode. |
| `article` | `"o"` \| `"a"` | `"a"` | The definite article, shown alongside the word so the player learns noun + article together, not just the noun. |
| `gender` | `"m"` \| `"f"` | `"f"` | Drives which badge (♂/♀) renders next to the word. |
| `emoji` | string | `"🍎"` | The prompt shown to the player. |
| `category` | string | `"food"` | Descriptive only — not currently used to gate which lesson a word appears in (see [design.md](design.md#word-difficulty-ramp)). Kept for a possible future category-specific lesson track. |
| `level` | number | `1` | Determines which lessons a word can appear in — see below. Currently `1` or `2`. |

Example entry:

```json
{ "id": "maca", "pt": "maçã", "en": "apple", "article": "a", "gender": "f", "emoji": "🍎", "category": "food", "level": 1 }
```

**Adding a word** is just appending an object with these 8 fields — no schema/migration to run since it's a static file.

### How `level` maps to lessons

`src/lib/lessons.js` decides the word pool for the next lesson from how many lessons are already in the player's history:

```js
const LEVEL_2_UNLOCK_AFTER = 3

export function currentWordPool(progress) {
  const cap = progress.history.length < LEVEL_2_UNLOCK_AFTER ? 1 : 2
  return words.filter((w) => w.level <= cap)
}
```

The first 3 completed lessons draw only from `level: 1` words; from the 4th completed lesson onward, the pool is the full `level <= 2` set. See [design.md](design.md#word-difficulty-ramp) for the reasoning.

## Progress — `localStorage["tugalingo-progress"]`

Written by `src/hooks/useProgress.js`, read back on every page load.

```json
{
  "history": [
    { "completedAt": "2026-07-11T17:41:14.223Z", "correct": 14, "total": 14 },
    { "completedAt": "2026-07-11T18:02:03.881Z", "correct": 9, "total": 10 }
  ],
  "activityByDate": {
    "2026-07-11": { "lessonsCompleted": 2 }
  }
}
```

| Field | Meaning |
|---|---|
| `history` | One entry per completed lesson, in order, ever. There's no per-lesson identity to key by since there's no lesson numbering — every completion is just appended. `history.length` is "how many lessons has the player played," and it's also what `currentWordPool` reads to decide the difficulty ramp. |
| `history[i].correct` / `total` | That attempt's score, kept as a fraction rather than a percentage so the fact that a lesson may have extended (10 vs 12 vs 14 questions) stays visible. A personal-best comparison (shown on the results screen) is `correct / total` across the whole array, not a stored field — computed fresh each time so it can't drift out of sync with `history`. |
| `history[i].completedAt` | ISO timestamp of that completion. |
| `activityByDate["<YYYY-MM-DD>"].lessonsCompleted` | How many lessons were completed on that calendar day, keyed by the player's local date (`src/lib/dates.js#dateKey`). Drives the heatmap; the current streak (`src/lib/dates.js#currentStreak`) is also computed from this object on the fly rather than stored, for the same reason — it can never disagree with the record it's derived from. |

A lesson only writes to this object once it's *completed* — exiting mid-lesson (the ✕ button) records nothing, so an abandoned attempt never counts toward `history`, a day's activity count, or the streak.

This is **per-browser, not per-player** — there's no login, so switching browsers/devices starts fresh (see [architecture.md](architecture.md#why-no-backend) for the tradeoff).

Session-only state (current round, in-lesson streak, current question index/total) lives in `Lesson.jsx`'s React state and is *not* persisted — it's discarded the moment a lesson ends or is exited, since only completed lessons are meaningful history.
