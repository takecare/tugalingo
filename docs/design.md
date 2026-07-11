# Game design

## Why emoji matching

A long lesson curriculum (translate a sentence, pick from a word bank, listen and type) is more infrastructure than a two-person learning game needs, and it's not the goal here — the goal is fast, low-friction vocabulary acquisition. Emoji-matching was picked because it removes English entirely from the round: the player goes straight from *concept* to *Portuguese word*, no translation step in between. Wordle-style games were the other inspiration point — short, single-serving rounds rather than a long lesson tree.

## Core loop

1. An emoji is shown.
2. Four Portuguese words are shown as options — the correct one plus three distractors from the same active pool.
3. Player picks one. Correct = green highlight, streak and lifetime-correct go up. Incorrect = the picked option turns red, the correct one turns green, streak resets to 0.
4. After ~900ms, a new round starts.

See [architecture.md](architecture.md#game-loop) for the implementation diagram.

## The gender badge mechanic

Portuguese nouns have grammatical gender that doesn't always match biological sex (*a mesa* — the table — is feminine; there's nothing "female" about a table). So gender isn't baked into the emoji itself. Instead every word option shows its article (*o*/*a*) plus a ♂/♀ badge:

```
🍎  →  [ a maçã ♀ ]
```

The badge is redundant with the article on purpose — repetition of the same signal (article + symbol) reinforces the gender pairing faster than the article alone, especially for a learner whose native language (English) doesn't mark noun gender at all.

## Categories

Words are tagged `food` or `animals`. The category picker just filters the active pool — it's not a separate mode, so switching category mid-session is free and doesn't reset streak or progress. Adding a category is purely a data change (see [data-model.md](data-model.md)); no UI or logic change needed since the picker is generated from a constant list that would just need the new category id added.

## Level unlock

All words start at `level: 1`. Once lifetime `totalCorrect` reaches 8, `level: 2` words join the pool permanently (they don't replace level 1 — the pool becomes level 1 + 2 combined). This is a soft difficulty ramp rather than a hard lesson-gate — the player never gets blocked, the pool just gets richer. The threshold (8) and the two-tier depth are deliberately simple for v1; see [data-model.md](data-model.md#word-bank--srcdatawordsjson) for how `level` is stored per word.

## Why verb conjugation is out of scope for this mode

Conjugation (*eu como*, *tu comes*, *ele come*...) has no natural emoji representation — an emoji can point at "eating" but not at "the second-person-singular present-tense form of eat." Forcing it into the matching format would mean showing the same 🍽️ emoji for six different correct answers depending on an invisible subject, which breaks the one-emoji-one-answer contract the whole game is built on. This was a deliberate scope cut, not an oversight — see the project's initial scoping discussion. If verb practice gets added later, it should be a distinct mode (e.g. fill-in-the-blank with a subject pronoun shown), not a variant of emoji matching.

## Non-goals for v1

- No audio/pronunciation.
- No sentence-level content (single words only).
- No accounts — see [architecture.md](architecture.md#why-no-backend).
- No lives/hearts system — an incorrect answer costs streak, not a life, since there's no "game over" state to protect against.
