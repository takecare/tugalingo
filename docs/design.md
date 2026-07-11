# Game design

## Why emoji matching

A long lesson curriculum (translate a sentence, pick from a word bank, listen and type) is more infrastructure than a two-person learning game needs, and it's not the goal here — the goal is fast, low-friction vocabulary acquisition. Emoji-matching was picked because it removes English entirely from the round: the player goes straight from *concept* to *Portuguese word*, no translation step in between. Wordle-style games were the other inspiration point — short, single-serving rounds rather than a long lesson tree.

## Core round loop

1. An emoji is shown.
2. Four Portuguese words are shown as options — the correct one plus three distractors from the same pool.
3. Player picks one. Correct = green highlight, in-lesson streak goes up. Incorrect = the picked option turns red, the correct one turns green, streak resets to 0.
4. After ~900ms, the next round starts (or the lesson ends — see below).

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

The `category` field (`food`/`animals`) is still on every word but isn't used for gating — there's one mixed pool rather than per-category tracks, so category is just descriptive metadata for now (useful if a category-specific mode gets added later).

## The gender badge mechanic

Portuguese nouns have grammatical gender that doesn't always match biological sex (*a mesa* — the table — is feminine; there's nothing "female" about a table). So gender isn't baked into the emoji itself. Instead every word option shows its article (*o*/*a*) plus a ♂/♀ badge:

```
🍎  →  [ a maçã ♀ ]
```

The badge is redundant with the article on purpose — repetition of the same signal (article + symbol) reinforces the gender pairing faster than the article alone, especially for a learner whose native language (English) doesn't mark noun gender at all.

## Streak + daily activity

The goal here is explicitly to create daily pressure — the player should feel like skipping a day costs them something, the same way Duolingo's streak does. Two things work together on the home screen:

- **Streak** — the number of consecutive days with at least one completed lesson, shown large at the top (`🔥 N day streak`). If today hasn't had a lesson yet, the streak from yesterday is still shown as "alive" with a nudge ("Do a lesson today to keep your streak!") rather than immediately showing 0 — the streak only actually breaks once a day passes with nothing done. This is computed fresh from the activity history every time (`currentStreak` in `src/lib/dates.js`), not stored as its own number, so it can never drift out of sync with the underlying daily record.
- **Activity heatmap** — the last 12 weeks, one cell per day, shaded by how many lessons were done. This is the memory the streak number doesn't have: a broken streak still leaves a visible record of everything before the gap, rather than erasing it. The streak creates the daily pressure; the heatmap is the honest longer-term picture underneath it.

A lesson only counts for the streak/heatmap if it's completed — see [above](#new-lesson-not-a-lesson-tree) on why quitting mid-lesson doesn't count.

## Why verb conjugation is out of scope for this mode

Conjugation (*eu como*, *tu comes*, *ele come*...) has no natural emoji representation — an emoji can point at "eating" but not at "the second-person-singular present-tense form of eat." Forcing it into the matching format would mean showing the same 🍽️ emoji for six different correct answers depending on an invisible subject, which breaks the one-emoji-one-answer contract the whole game is built on. This was a deliberate scope cut, not an oversight. If verb practice gets added later, it should be a distinct mode (e.g. fill-in-the-blank with a subject pronoun shown), not a variant of emoji matching.

## Non-goals for v1

- No audio/pronunciation.
- No sentence-level content (single words only).
- No accounts — see [architecture.md](architecture.md#why-no-backend).
- No lives/hearts system — an incorrect answer costs streak, not a life, since there's no "game over" state to protect against.
