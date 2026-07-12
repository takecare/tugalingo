# Game design

## Why emoji matching

A long lesson curriculum (translate a sentence, pick from a word bank, listen and type) is more infrastructure than a two-person learning game needs, and it's not the goal here — the goal is fast, low-friction vocabulary acquisition. Emoji-matching was picked because it removes English entirely from the round: the player goes straight from *concept* to *Portuguese word*, no translation step in between. Wordle-style games were the other inspiration point — short, single-serving rounds rather than a long lesson tree.

## Core round loop

1. An emoji is shown.
2. Four Portuguese words are shown as options — the correct one plus three distractors from the same pool.
3. Player picks one. Correct = green highlight, in-lesson streak goes up. Incorrect = the picked option turns red, the correct one turns green, streak resets to 0.
4. After ~900ms, the next round starts (or the lesson ends — see below).

## Question types

"Match single emoji to gendered word" is one *question type*, not the only shape this game can take. Question types are a registry: each is a self-contained pair of a data generator (`src/lib/questionTypes/`) and a renderer (`src/components/questions/`), looked up by a `type` string. `Lesson.jsx` runs the round loop (progress bar, extend rule, in-lesson streak) without knowing or caring what kind of question it's showing, so adding a type is additive — a new file plus one registry line — rather than a rewrite of the lesson loop. See [architecture.md](architecture.md#question-types) for the file layout and [data-model.md](data-model.md#question-schema) for the exact `Question`/`Answer` shape.

Five types exist:

- **`emoji-match`** — the original mechanic (see [above](#core-round-loop)). Recognition: see a concept, pick the word.
- **`reverse-match`** — the mirror: the word is the prompt, four emoji are the choices. This is recall rather than recognition (harder — you can't lean on eliminating obviously-wrong emoji the way you can eliminate obviously-wrong words), so it's unlocked a little after `emoji-match`.
- **`compound-match`** — multiple emoji together as one prompt, for concepts a single emoji can't represent (see [below](#compound-concepts-via-compound-match)).
- **`type-in`** — an emoji prompt again, but the player types the Portuguese word instead of picking it. Production instead of recognition, which is a bigger jump in difficulty than `reverse-match` — get it right without four options to narrow it down. Checked accent- and case-insensitively (`typeIn.js`'s `normalize()`), so a learner without easy access to ã/ç/õ on their keyboard isn't marked wrong for the accent alone, only for the word itself.
- **`sentence-fill`** — verb conjugation (see below).

### Question types unlock gradually

None of the newer types are in the mix from lesson one — `activeQuestionTypes(progress)` in `src/lib/lessons.js` unlocks them by completed-lesson count: `reverse-match` after 2, `compound-match` after 4, `type-in` after 5, `sentence-fill` after 8. The reasoning is the same as the word-level ramp below: showing every mechanic at once on day one is overwhelming, and the harder types build on comfort with the easier ones (`reverse-match` and `type-in` are harder versions of the *same* skill emoji-match teaches; `compound-match` introduces new but small content that's more fun once the basic prompt-then-choose pattern is familiar; `sentence-fill` is a different skill altogether that's easiest to take on once vocab itself isn't the bottleneck).

## Emoji variants

Some concepts have more than one commonly-used emoji — a cat is just as much 🐱 as 🐈. Rather than pick one and stick with it, words that have a genuinely equivalent alternate list it in `emojiVariants` (`src/data/words.json`), and `pickEmoji(word)` (`src/lib/emoji.js`) picks at random between `emoji` and its variants *every time that word comes up*, across `emoji-match`, `reverse-match`, and `type-in`. The point is to stop the player from quietly memorizing "this exact glyph = this word" instead of "this concept = this word" — if 🐱 and 🐈 don't both mean *gato* to her, she hasn't really learned *gato*, she's learned to recognize one drawing.

This is deliberately conservative: a variant has to be unambiguously the *same* word, not just a related one. 🐱/🐈 (cat) and 🍎/🍏 (apple, red or green) qualify; a polar bear emoji does not become a variant of `urso` (bear), because that arguably names a different animal in Portuguese too. When a word has no genuinely equivalent second emoji, it just doesn't get an `emojiVariants` list — most words in the bank are still single-emoji.

## Compound concepts, via compound-match

Some vocabulary only exists as a *combination*, not as a single word attached to a single emoji: ☕ alone is *café*, but ☕ next to 🥛 isn't "coffee and milk" as separate ideas, it's a specific drink with its own name and its own emoji arrangement. European Portuguese distinguishes these by how much milk there is — *galão* (a lot of milk, served tall, like a latte) vs. *meia de leite* (half and half, like a flat white) — which is exactly the kind of real, useful vocabulary a single-emoji format can't reach.

`compound-match` (`src/data/compounds.json`) shows a short row of 2-3 emoji as one prompt (e.g. `☕ 🥛 🥛`) and asks for the word/phrase, multiple choice, the same as `emoji-match`. The repetition and ordering of emoji is meaningful and has to be unique per entry — see [data-model.md](data-model.md#compound-bank--srcdatacompoundsjson) for why two compounds can never share an emoji sequence. The bank starts small (four entries: `galão`, `meia de leite`, `sumo de laranja`, `pão com manteiga`) and is meant to grow the same way `words.json` and `verbs.json` did — one hand-picked, unambiguous combination at a time.

## Verb conjugation, via sentence-fill

Conjugation (*eu falo*, *tu falas*, *ele fala*...) has no natural emoji representation on its own — an emoji can point at "speaking" but not at "the second-person-singular present-tense form of speak." That's still true, and it's why conjugation isn't bolted onto `emoji-match`. Instead, `sentence-fill` gives it a minimal sentence frame it can live in: an emoji sets the scene (🗣️), a pronoun is shown as text (*Tu*), and the player picks the matching conjugated form from four choices — `[falo, falas, fala, falamos]`.

The four choices are deliberately drawn from *the same verb's other persons*, not from unrelated verbs. That's the actual skill being tested — subject-verb agreement — rather than "which verb was that emoji." Picking `fala` when the sentence says `Tu ___` should feel wrong the way subject-verb mismatches feel wrong once the pattern clicks, and that only happens if the distractors are real near-misses.

Content is deliberately narrow for now (`src/data/verbs.json`): present tense only, and only regular `-ar` verbs (*falar, comprar, morar, trabalhar, estudar, cantar, dançar, cozinhar*) — by far the most regular conjugation pattern, so the first exposure to conjugation is to the pattern that generalizes best, before `-er`/`-ir` verbs or irregulars (*ser, estar, ter*...) get added. The pronoun set is `eu / tu / ele-ela / nós / eles-elas` — no *vós*, since that's archaic outside a few regions — and `tu` is included deliberately: European Portuguese uses *tu* informally where Brazilian Portuguese would default to *você* (which conjugates like *ele/ela*), so including it is part of what keeps this game's Portuguese distinctly European rather than generic.

No English gloss is shown for the verb, matching the "no translation step" philosophy from [above](#why-emoji-matching) — the emoji plus the recurring, small set of pronouns is meant to be enough context, the same way the four-word-choice emoji-match round never shows English either.

## Lesson length and the extend rule

Lessons are the unit of play, not an endless stream — this is the core change from the original free-play version, and it's what makes "how many lessons has she done" and "how many did she get right" meaningful things to track.

- Every lesson starts as **10 questions**.
- At question 10, the number of correct answers *in that first 10* decides what happens next:
  - **9 correct** → extends to **12** questions (2 more).
  - **10 correct** → extends to **14** questions (4 more).
  - **8 or fewer** → the lesson ends right there, at 10.

![Lesson flow](images/lesson-flow.png)

The extension is a reward for strong performance, not a random bonus round — the better you did on the first 10, the longer (and implicitly harder to sustain) the lesson gets. This was chosen over a fixed-length lesson because it means someone who already knows the words moves through faster on an easy lesson and gets more practice exactly when they're doing well, without needing a separate "hard mode" toggle.

## "New Lesson," not a lesson tree

There's no lesson map, no numbered lessons, no unlocking one lesson by finishing another. There's a single **New Lesson** button on the home screen — pressing it always starts a fresh lesson from whatever the current word pool is. This is a deliberate change from an earlier numbered-lesson-path version: a lesson tree implies a finish line ("I've done all the lessons"), which works against a habit-forming vocabulary drill that's meant to be played indefinitely, a little bit every day. Quitting a lesson partway (the ✕ button) discards it entirely — no partial credit, and it doesn't count toward the day's activity or the streak (see below). Nothing is written to storage until a lesson is actually completed.

## Word difficulty ramp

Words are tagged `level: 1` or `level: 2` in the word bank. The first 3 lessons ever completed draw only from level-1 words; from the 4th completed lesson onward, the pool includes both levels combined (`currentWordPool` in `src/lib/lessons.js`, keyed off how many lessons are in the player's history so far). Adding a `level: 3` tier to `words.json` would extend the ramp further by adjusting the threshold in that same function.

The `category` field (`food`/`animals`/`drinks`/`everyday`) is on every word but isn't used for gating — there's one mixed pool rather than per-category tracks, so category is just descriptive metadata for now (useful if a category-specific mode gets added later).

## The gender badge mechanic

Portuguese nouns have grammatical gender that doesn't always match biological sex (*a mesa* — the table — is feminine; there's nothing "female" about a table). So gender isn't baked into the emoji itself. Instead every word option shows its article (*o*/*a*) plus a ♂/♀ badge:

```
🍎  →  [ a maçã ♀ ]
```

The badge is redundant with the article on purpose — repetition of the same signal (article + symbol) reinforces the gender pairing faster than the article alone, especially for a learner whose native language (English) doesn't mark noun gender at all.

## Streak + daily activity

The goal here is explicitly to create daily pressure — the player should feel like skipping a day costs them something, the same way Duolingo's streak does. Two things work together on the home screen:

- **Streak** — the number of consecutive days with at least one completed lesson, shown large at the top (`🔥 N day streak`). If today hasn't had a lesson yet, the streak from yesterday is still shown as "alive" with a nudge ("Do a lesson today to keep your streak!") rather than immediately showing 0 — the streak only actually breaks once a day passes with nothing done. This is computed fresh from the activity history every time (`currentStreak` in `src/lib/dates.js`), not stored as its own number, so it can never drift out of sync with the underlying daily record.
- **Activity heatmap** — the last 30 days, one cell per day, shaded by how many lessons were done, wrapped into rows of 7 with today always the last cell. This is the memory the streak number doesn't have: a broken streak still leaves a visible record of everything before the gap, rather than erasing it. The streak creates the daily pressure; the heatmap is the honest longer-term picture underneath it.

A lesson only counts for the streak/heatmap if it's completed — see [above](#new-lesson-not-a-lesson-tree) on why quitting mid-lesson doesn't count.

## Non-goals for v1

- No audio/pronunciation.
- No accounts — see [architecture.md](architecture.md#why-no-backend).
- No lives/hearts system — an incorrect answer costs streak, not a life, since there's no "game over" state to protect against.
- No irregular verbs or tenses beyond present-tense regular `-ar` — see [above](#verb-conjugation-via-sentence-fill).
