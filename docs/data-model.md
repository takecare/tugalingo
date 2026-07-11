# Data model

There are two pieces of data in the app: the static word bank, and the player's persisted progress.

## Word bank — `src/data/words.json`

An array of word entries. Each entry:

| Field | Type | Example | Notes |
|---|---|---|---|
| `id` | string | `"maca"` | Stable, unique, ASCII (used as React key and to avoid repeating the same word twice in a row). |
| `pt` | string | `"maçã"` | The Portuguese word, European Portuguese spelling. |
| `en` | string | `"apple"` | English translation — not shown in-game currently, kept for a future "show translation" hint or a different game mode. |
| `article` | `"o"` \| `"a"` | `"a"` | The definite article, shown alongside the word so the player learns noun + article together, not just the noun. |
| `gender` | `"m"` \| `"f"` | `"f"` | Drives which badge (♂/♀) renders next to the word. Kept as a separate field (rather than derived from `article`) since it's the more fundamental fact — `article` is displayed, `gender` is queried. |
| `emoji` | string | `"🍎"` | The prompt shown to the player. |
| `category` | string | `"food"` | Used by the category filter. Currently `"food"` or `"animals"`; adding a category is just adding entries with a new value here — no code change needed. |
| `level` | number | `1` | Gates when a word enters the pool (see [design.md](design.md#level-unlock) for the unlock rule). Currently `1` or `2`. |

Example entry:

```json
{ "id": "maca", "pt": "maçã", "en": "apple", "article": "a", "gender": "f", "emoji": "🍎", "category": "food", "level": 1 }
```

**Adding a word** is just appending an object with these 7 fields to the array — no schema/migration to run since it's a static file.

## Progress — `localStorage["tugalingo-progress"]`

Written by `src/hooks/useProgress.js`, read back on every page load.

```json
{ "totalCorrect": 12, "totalAnswered": 15, "bestStreak": 6 }
```

| Field | Meaning |
|---|---|
| `totalCorrect` | Lifetime correct answers on this browser. Drives level-2 unlock. |
| `totalAnswered` | Lifetime rounds played on this browser. Not surfaced in the UI yet — kept for a future accuracy stat. |
| `bestStreak` | Highest consecutive-correct streak ever reached on this browser. |

Note this is **per-browser, not per-player** — there's no login, so switching browsers/devices starts fresh (see [architecture.md](architecture.md#why-no-backend) for the tradeoff).

Session-only state (current streak, current round, selected category) lives in `Game.jsx`'s React state and is *not* persisted — it resets on every page reload by design, since "how many did you get right just now" isn't meaningful across sessions the way lifetime totals are.
