# Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| UI framework | React + Vite | Component-based, fast dev server, scales cleanly as more screens/modes get added. |
| State | React `useState`/`useMemo`, no external store | The state graph is small (current screen, current lesson's round/progress) — a store like Redux/Zustand would be overhead for this size. |
| Persistence | Browser `localStorage` | No login needed for a two-person project; progress just needs to survive a page reload on the same device/browser. |
| Content | Static JSON (`src/data/words.json`, `src/data/verbs.json`) | Word/verb banks are hand-curated and small; no need for a database or CMS. |
| Hosting | Static site (Vercel/Netlify/GitHub Pages) | The whole app is a static bundle — no backend to run or pay for. |

## Component / data flow

![Architecture diagram](images/architecture.png)

- **`src/data/words.json`** is the noun/vocab bank; **`src/data/verbs.json`** is the verb-conjugation bank — both pure data, no logic.
- **`src/lib/lessons.js`** decides what content the *next* lesson draws from: `currentWordPool`/`currentVerbPool` (the difficulty ramp), `buildLessonContext` (bundles both into one object), `activeQuestionTypes` (which question types are unlocked so far), and the extend-past-10 rule — pure functions, no React.
- **`src/lib/questionTypes/`** is the question-type registry — see [Question types](#question-types) below.
- **`src/lib/round.js`** picks a random target + 3 distractors from whatever pool it's handed; used by any multiple-choice question type (`emoji-match`, `reverse-match`, `sentence-fill`).
- **`src/lib/dates.js`** has the date helpers shared by the progress hook and the home screen: `dateKey`, `lastNDays`, and `currentStreak`.
- **`src/hooks/useProgress.js`** owns everything persisted: the full history of completed lessons and which calendar days had activity. It exposes one write path — `recordLessonCompletion(correct, total)` — called exactly once, when a lesson finishes. Exiting a lesson early never calls it.
- **`src/App.jsx`** is a tiny screen router with three states: `home`, `lesson`, `results`. It's also where a lesson's content (`buildLessonContext`) and unlocked question types (`activeQuestionTypes`) are picked the moment "New Lesson" is pressed, and where the streak shown on the results screen is computed. No game logic lives here beyond that wiring.
- **`src/components/Home.jsx`** — the home screen: streak header, `ActivityHeatmap`, and the "New Lesson" button.
- **`src/components/Lesson.jsx`** — plays one lesson: the round loop, the question-10 extend check, the progress bar. It knows nothing about *what kind* of question it's showing — it asks the registry for one and renders whatever comes back (see below).
- **`src/components/questions/`** — one renderer component per question type, plus the registry (`QuestionRenderer`) that picks the right one, and `optionClassName.js`, a small shared helper so every choice-based renderer gets the same correct/incorrect/disabled styling without depending on each other.
- **`src/components/OptionButton.jsx`** — presentational, used by `EmojiMatchQuestion`; the other choice-based renderers (`ReverseMatchQuestion`, `SentenceFillQuestion`) render their own buttons since their content (an emoji, a bare word) doesn't fit the article+gender layout `OptionButton` is shaped for, but share its feedback-class logic via `optionClassName.js`.
- **`src/components/LessonResults.jsx`** — the post-lesson score screen, including the updated streak.

## Question types

Every question in a lesson is a plain data object plus a matching renderer, looked up by `type` — this is what makes adding a new kind of exercise additive rather than a rewrite of `Lesson.jsx`. Four are implemented:

| Type | Prompt | Answer | Content pool |
|---|---|---|---|
| `emoji-match` | emoji | pick the word (4 choices) | `words` |
| `reverse-match` | word | pick the emoji (4 choices) | `words` |
| `type-in` | emoji | type the word (free text) | `words` |
| `sentence-fill` | emoji + pronoun | pick the conjugated verb form (4 choices) | `verbs` |

- **`src/lib/questionTypes/<type>.js`** — the logic half. Exports `type` (a string id), `generate(context, avoidWordId) -> Question`, and `isCorrect(question, answer) -> boolean`. `context` is the `{ words, verbs }` object from `buildLessonContext` — each module reads whichever field(s) it needs.
- **`src/lib/questionTypes/index.js`** — the registry. `generateQuestion(type, context, avoidWordId)` and `checkAnswer(question, answer)` dispatch to the right module by `question.type`. This is the only file that needs a new line added when a question type is added.
- **`src/components/questions/<Type>Question.jsx`** — the rendering half: takes `{ question, feedback, onAnswer }` and renders the prompt + answer UI, calling `onAnswer(answer)` when the player responds. `feedback` is `{ correct, answer }` once one has been submitted, or `null` before that.
- **`src/components/questions/index.jsx`** — the component registry (`QuestionRenderer`), keyed the same way as the logic registry above. It renders with `key={question.id}` so any question-local UI state (e.g. `TypeInQuestion`'s text input) resets between questions, even two of the same type back to back.

`Lesson.jsx` only ever calls `generateQuestion`, `checkAnswer`, and renders `<QuestionRenderer />` — it has no `if (type === ...)` branches, so it doesn't grow as question types are added. New types don't appear in every lesson from the moment they're registered, either — see `activeQuestionTypes` in [design.md](design.md#question-types) for the unlock progression. See [data-model.md](data-model.md#question-schema) for the exact `Question`/`Answer` shape.

## Lesson flow

![Lesson flow diagram](images/lesson-flow.png)

A lesson is 10 questions minimum. At question 10, the running correct-count decides whether it extends — see [design.md](design.md#lesson-length-and-the-extend-rule) for the exact rule and the reasoning behind it.

## Why no backend

The two questions that usually justify a backend — "does progress need to sync across devices?" and "does someone need to log in?" — were both answered no. `useProgress.js` is the single seam to swap if that changes later: it already isolates all read/write of progress behind `progress` and `recordLessonCompletion`, so replacing `localStorage` with an API call wouldn't touch `Lesson.jsx`, `Home.jsx`, or `LessonResults.jsx`.

## Folder structure

```
src/
  data/
    words.json          # noun/vocab bank
    verbs.json           # verb-conjugation bank
  hooks/
    useProgress.js       # persisted lesson history + daily activity
  lib/
    lessons.js            # pools, buildLessonContext(), activeQuestionTypes(), extend rule
    questionTypes/
      emojiMatch.js         # emoji -> pick the word
      reverseMatch.js        # word -> pick the emoji
      typeIn.js                # emoji -> type the word
      sentenceFill.js           # verb conjugation fill-in-the-blank
      index.js                   # question-type registry: generateQuestion(), checkAnswer()
    round.js               # pickRound() / shuffle()
    dates.js                # dateKey(), lastNDays(), currentStreak()
  components/
    Home.jsx                # home screen: streak + heatmap + New Lesson
    ActivityHeatmap.jsx      # calendar heatmap
    Lesson.jsx                # plays one lesson, question-type-agnostic
    questions/
      EmojiMatchQuestion.jsx   # renders emoji-match
      ReverseMatchQuestion.jsx  # renders reverse-match
      TypeInQuestion.jsx         # renders type-in
      SentenceFillQuestion.jsx    # renders sentence-fill
      optionClassName.js           # shared correct/incorrect/disabled class logic
      index.jsx                     # component registry: <QuestionRenderer />
    OptionButton.jsx          # word-choice button (article + pt + gender)
    LessonResults.jsx          # post-lesson score + streak screen
  App.jsx                      # screen router (home / lesson / results)
  App.css                       # all styling
  index.css                      # theme variables, base styles
```
