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

## Lesson unlocking and replay

Lessons are sequential: lesson *N* unlocks once lesson *N-1* has been completed at least once (lesson 1 is always open). Completed lessons stay playable — replaying one doesn't erase the previous result, it just updates the **best score** for that lesson if the new attempt beats it (see [data-model.md](data-model.md#progress--localstoragetugalingo-progress) for exactly how that's stored). This mirrors how a real learner actually uses drilling: going back to reinforce an earlier lesson should always be safe, never something that can make your recorded progress look worse.

## Word difficulty ramp

Words are tagged `level: 1` or `level: 2` in the word bank. Lessons 1-3 draw only from level-1 words; from lesson 4 onward, the pool includes both levels combined. This is a coarse, lesson-indexed ramp rather than the old "unlock after N lifetime correct answers" rule — tying difficulty to lesson number (rather than a running lifetime counter) means the ramp is the same every time regardless of how many times earlier lessons get replayed. Adding a `level: 3` tier to `words.json` would extend the ramp further without any code change beyond adjusting `levelCapForLesson` in `src/lib/lessons.js`.

The `category` field (`food`/`animals`) is still on every word but isn't used for gating anymore — lessons are one mixed track rather than per-category tracks, so category is just descriptive metadata for now (useful if a category-specific lesson track gets added later).

## The gender badge mechanic

Portuguese nouns have grammatical gender that doesn't always match biological sex (*a mesa* — the table — is feminine; there's nothing "female" about a table). So gender isn't baked into the emoji itself. Instead every word option shows its article (*o*/*a*) plus a ♂/♀ badge:

```
🍎  →  [ a maçã ♀ ]
```

The badge is redundant with the article on purpose — repetition of the same signal (article + symbol) reinforces the gender pairing faster than the article alone, especially for a learner whose native language (English) doesn't mark noun gender at all.

## Daily activity tracking

Two things are tracked day-to-day: whether *today* has a completed lesson, and a calendar view of past days. This was built as a heatmap (count per day) rather than a classic "consecutive-day streak counter" — a streak number creates all-or-nothing anxiety (miss one day, the whole number resets to zero and the history is gone). A heatmap just shows what actually happened, good days and gaps alike, without punishing a missed day by erasing the record of everything before it.

## Why verb conjugation is out of scope for this mode

Conjugation (*eu como*, *tu comes*, *ele come*...) has no natural emoji representation — an emoji can point at "eating" but not at "the second-person-singular present-tense form of eat." Forcing it into the matching format would mean showing the same 🍽️ emoji for six different correct answers depending on an invisible subject, which breaks the one-emoji-one-answer contract the whole game is built on. This was a deliberate scope cut, not an oversight. If verb practice gets added later, it should be a distinct mode (e.g. fill-in-the-blank with a subject pronoun shown), not a variant of emoji matching.

## Non-goals for v1

- No audio/pronunciation.
- No sentence-level content (single words only).
- No accounts — see [architecture.md](architecture.md#why-no-backend).
- No lives/hearts system — an incorrect answer costs streak, not a life, since there's no "game over" state to protect against.
