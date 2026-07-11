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

`src/lib/lessons.js` decides the word pool per lesson number:

```js
function levelCapForLesson(lessonNumber) {
  return lessonNumber <= 3 ? 1 : 2
}
```

Lessons 1-3 draw only from `level: 1` words; lesson 4 onward draws from the full `level <= 2` pool. See [design.md](design.md#word-difficulty-ramp) for the reasoning.

## Progress — `localStorage["tugalingo-progress"]`

Written by `src/hooks/useProgress.js`, read back on every page load.

```json
{
  "totalLessonsCompleted": 3,
  "lessons": {
    "1": { "attempts": 2, "bestCorrect": 14, "bestTotal": 14, "lastPlayedAt": "2026-07-11T17:41:14.223Z" },
    "2": { "attempts": 1, "bestCorrect": 9, "bestTotal": 10, "lastPlayedAt": "2026-07-11T18:02:03.881Z" }
  },
  "activityByDate": {
    "2026-07-11": { "lessonsCompleted": 3 }
  }
}
```

| Field | Meaning |
|---|---|
| `totalLessonsCompleted` | Lifetime count of finished lessons, including replays of the same lesson number. This is "how many lessons has the player played." |
| `lessons["<N>"].attempts` | How many times lesson *N* has been completed. |
| `lessons["<N>"].bestCorrect` / `bestTotal` | The best-scoring attempt at lesson *N*, kept as a fraction (`bestCorrect`/`bestTotal`) rather than a percentage so both the raw score and the fact that the lesson may have extended (10 vs 12 vs 14) stay visible. Comparing attempts uses `correct / total`, so a 9/10 doesn't automatically lose to an 11/14 — it's judged by accuracy, not question count. |
| `lessons["<N>"].lastPlayedAt` | ISO timestamp of the most recent attempt at lesson *N* (not necessarily the best one). |
| `activityByDate["<YYYY-MM-DD>"].lessonsCompleted` | How many lessons were completed on that calendar day, keyed by the player's local date (`src/lib/dates.js#dateKey`). Drives both the "done today" banner and the heatmap. |

A lesson only writes to this object once it's *completed* — exiting mid-lesson (the ✕ button) records nothing, so an abandoned attempt never counts as a "played" lesson or shows up in a day's activity count.

This is **per-browser, not per-player** — there's no login, so switching browsers/devices starts fresh (see [architecture.md](architecture.md#why-no-backend) for the tradeoff).

Session-only state (current round, current streak, current question index/total within a lesson) lives in `Lesson.jsx`'s React state and is *not* persisted — it's discarded the moment a lesson ends or is exited, since only completed lessons are meaningful history.
