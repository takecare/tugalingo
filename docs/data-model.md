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

## Verb bank — `src/data/verbs.json`

An array of regular `-ar` present-tense verbs, used by the `sentence-fill` question type (see [design.md](design.md#question-types) for why conjugation needed its own content and question type rather than reusing `words.json`).

| Field | Type | Example | Notes |
|---|---|---|---|
| `id` | string | `"falar"` | Stable, unique, ASCII — same role as a word's `id`. |
| `en` | string | `"to speak"` | English gloss — not shown in-game (see [design.md](design.md#question-types) on why), kept for readability of this file. |
| `emoji` | string | `"🗣️"` | The scene-setting icon shown above the sentence. |
| `level` | number | `1` | Same ramp mechanism as `words.json`'s `level` — currently all verbs are `1`. |
| `conjugations` | object | see below | Present-tense forms, keyed by person. |

`conjugations` has five keys — `eu`, `tu`, `ele_ela`, `nos`, `eles_elas` — each `{ pronoun, form }`, e.g. `"tu": { "pronoun": "Tu", "form": "falas" }`. Only five persons are modeled (no "vós") since that's what's actually in everyday use in Portugal; note `tu` is included deliberately — European Portuguese uses it in informal speech where Brazilian Portuguese would say `você`, so it's part of what makes this "European," not "generic," Portuguese.

Example entry:

```json
{
  "id": "falar",
  "en": "to speak",
  "emoji": "🗣️",
  "level": 1,
  "conjugations": {
    "eu": { "pronoun": "Eu", "form": "falo" },
    "tu": { "pronoun": "Tu", "form": "falas" },
    "ele_ela": { "pronoun": "Ele/Ela", "form": "fala" },
    "nos": { "pronoun": "Nós", "form": "falamos" },
    "eles_elas": { "pronoun": "Eles/Elas", "form": "falam" }
  }
}
```

**Adding a verb** is appending one of these objects — only regular `-ar` verbs fit the current content without changes; an irregular verb would still work data-wise (the five forms are just spelled out, not derived), it's only a curation choice to stick to regulars for now (see [design.md](design.md#question-types)).

## Question schema

`src/lib/questionTypes/` generates one of these per round, and `src/components/questions/` renders it — see [architecture.md](architecture.md#question-types) for how the registries plug together. Every question type produces a `Question` object with this shape (some fields only make sense for multiple-choice types; `type-in` leaves `choices`/`correctChoiceIds` empty and checks against `correctText` instead):

| Field | Type | Example (`emoji-match`) | Notes |
|---|---|---|---|
| `id` | string | `"maca"` | Unique per question instance — used as the React key for the current round (`sentence-fill`'s is `"<verbId>-<person>"` since the same verb can produce multiple distinct questions). |
| `type` | string | `"emoji-match"` | Which registry entry generated/renders this question. |
| `wordId` | string | `"maca"` | The underlying `words.json`/`verbs.json` entry this question is about — used to avoid repeating the same word or verb twice in a row. |
| `title` | string | `"Match the word"` | Short description of the exercise; not currently rendered by any renderer but available for a type whose prompt needs framing. |
| `body` | object | `{ emoji: "🍎" }` | Type-specific prompt data — whatever the renderer needs to show the question. `reverse-match`'s is `{ article, pt, gender }`; `sentence-fill`'s is `{ emoji, pronoun }`. |
| `choices` | array | `[{ id, article, pt, gender }, ...]` | The answer options, for multiple-choice types. `reverse-match` choices are `{ id, emoji }`; `sentence-fill` choices are `{ id, label }` (the conjugated form text). Empty for `type-in`. |
| `correctChoiceIds` | array of string | `["maca"]` | Which `choices[].id`(s) are correct — an array rather than a single id so a future type can have more than one right answer. Empty for `type-in`. |
| `correctText` | string | *(only on `type-in`)* | What the player's normalized input is compared against — see `typeIn.js`'s `normalize()` for the accent/case-insensitive comparison. |

An `Answer` is whatever the player submitted, passed to `checkAnswer(question, answer)`:
- Choice-based types: `{ type: "emoji-match", choiceId: "maca" }`
- `type-in`: `{ type: "type-in", text: "maca" }` (whatever the player typed, unnormalized — `isCorrect` does the normalizing)

**Adding a question type** means adding `src/lib/questionTypes/<type>.js` (exporting `type`, `generate(context, avoidWordId)`, `isCorrect(question, answer)`) and `src/components/questions/<Type>Question.jsx` (rendering `{ question, feedback, onAnswer }`), then registering both in their respective `index` files. Listing the new type in `QUESTION_TYPE_UNLOCKS` (`src/lib/lessons.js`) puts it into rotation once the chosen lesson-count threshold is reached — see [design.md](design.md#question-types) for the current thresholds and why they're staggered rather than all unlocked at once.

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
