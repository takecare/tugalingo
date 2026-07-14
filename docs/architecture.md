# Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| UI framework | React + Vite | Component-based, fast dev server, scales cleanly as more screens/modes get added. |
| State | React `useState`/`useMemo`, no external store | The state graph is small (current screen, current lesson's round/progress) — a store like Redux/Zustand would be overhead for this size. |
| Persistence | Browser `localStorage` | No login needed for a two-person project; progress just needs to survive a page reload on the same device/browser. |
| Content | Static JSON (`src/data/words.json`, `src/data/verbs.json`, `src/data/compounds.json`) | Word/verb/compound banks are hand-curated and small; no need for a database or CMS. |
| Hosting | Static site (Vercel/Netlify/GitHub Pages) | The whole app is a static bundle — no backend to run or pay for. |

## Component / data flow

![Architecture diagram](images/architecture.png)

- **`src/data/words.json`** is the noun/vocab bank; **`src/data/verbs.json`** is the verb-conjugation bank; **`src/data/compounds.json`** is the multi-emoji compound-concept bank; **`src/data/phrases.json`** is the conversational phrase bank — all pure data, no logic.
- **`src/lib/lessons.js`** decides what content the *next* lesson draws from: `currentWordPool`/`currentVerbPool`/`currentCompoundPool`/`currentPhrasePool` (the difficulty ramp), `buildLessonContext` (bundles all four into one object), `activeQuestionTypes` (which question types are unlocked so far), and the extend-past-10 rule — pure functions, no React.
- **`src/lib/emoji.js`** — `pickEmoji(word)` picks one emoji from a word's `emoji` plus any `emojiVariants` each time it's asked, so a word with more than one valid emoji (e.g. a cat) doesn't always show the same glyph.
- **`src/lib/questionTypes/`** is the question-type registry — see [Question types](#question-types) below.
- **`src/lib/round.js`** picks a random target + 3 distractors from whatever pool it's handed; used by any multiple-choice question type (`emoji-match`, `reverse-match`, `sentence-fill`, `compound-match`, `gender-match`, `phrase-match`).
- **`src/lib/dates.js`** has the date helpers shared by the progress hook and the home screen: `dateKey`, `recentDays`, and `currentStreak`.
- **`src/lib/progressFile.js`** — `downloadProgress(progress)` and `parseProgressFile(file)`, the export/import logic (see [Progress export/import](#progress-exportimport) below).
- **`src/lib/debug.js`** — `isDebugMode()`/`isStudioMode()`, whether `?debug=true`/`?studio=true` is in the URL (see [Debug mode](#debug-mode) and [Content studio](#content-studio) below).
- **`src/lib/studio.js`**, **`src/lib/studioPreview.js`**, **`src/lib/studioFile.js`** — the content studio's logic (see [Content studio](#content-studio) below).
- **`src/hooks/useProgress.js`** owns everything persisted: the full history of completed lessons and which calendar days had activity. It exposes two write paths — `recordLessonCompletion(correct, total)`, called once when a lesson finishes, and `replaceProgress(newProgress)`, called on a successful import. Exiting a lesson early calls neither.
- **`src/App.jsx`** is a tiny screen router with five states: `home`, `lesson`, `debug`, `studio`, `results`. It's also where a lesson's content (`buildLessonContext`) and unlocked question types (`activeQuestionTypes`) are picked the moment "New Lesson" is pressed, and where the streak shown on the results screen is computed. No game logic lives here beyond that wiring.
- **`src/components/Home.jsx`** — the home screen: streak header, `ActivityHeatmap`, the "New Lesson" button, the export/import buttons, and (in debug/studio mode) the Debug/Studio buttons.
- **`src/components/Lesson.jsx`** — plays one lesson: the round loop, the question-10 extend check, the progress bar. It knows nothing about *what kind* of question it's showing — it asks the registry for one and renders whatever comes back (see below).
- **`src/components/DebugMenu.jsx`** — lists every question type for direct selection (see [Debug mode](#debug-mode) below).
- **`src/components/Studio.jsx`** — the content studio's UI (see [Content studio](#content-studio) below).
- **`src/components/questions/`** — one renderer component per question type, plus the registry (`QuestionRenderer`) that picks the right one, and `optionClassName.js`, a small shared helper so every choice-based renderer gets the same correct/incorrect/disabled styling without depending on each other.
- **`src/components/OptionButton.jsx`** — presentational, used by `EmojiMatchQuestion`, `CompoundMatchQuestion`, and `GenderMatchQuestion` (all have article+pt+gender-shaped choices); the other choice-based renderers (`ReverseMatchQuestion`, `SentenceFillQuestion`, `PhraseMatchQuestion`) render their own buttons since their content (an emoji, a bare word, a reply phrase) doesn't fit that layout, but share its feedback-class logic via `optionClassName.js`.
- **`src/components/LessonResults.jsx`** — the post-lesson score screen, including the updated streak.
- **`src/components/VersionBadge.jsx`** — the small commit-SHA link in the bottom corner, present on every screen. Reads a `__COMMIT_SHA__` global that `vite.config.js` injects at build time via `define`: it's `VITE_COMMIT_SHA` (set by `.github/workflows/deploy.yml` to `github.sha`) in CI, or the local working tree's `git rev-parse HEAD` otherwise, so it's meaningful in `npm run dev`/`build` too, not just the deployed site.

## Question types

Every question in a lesson is a plain data object plus a matching renderer, looked up by `type` — this is what makes adding a new kind of exercise additive rather than a rewrite of `Lesson.jsx`. Seven are implemented:

| Type | Prompt | Answer | Content pool |
|---|---|---|---|
| `emoji-match` | emoji | pick the word (4 choices) | `words` |
| `reverse-match` | word | pick the emoji (4 choices) | `words` |
| `phrase-match` | emoji + conversational phrase | pick the reply (4 choices) | `phrases` |
| `compound-match` | 2-3 emoji together | pick the word/phrase (4 choices) | `compounds` |
| `type-in` | emoji | type the word (free text) | `words` |
| `gender-match` | emoji + ♂/♀ symbol | pick the sex-matching word form (4 choices) | `words` (entries with `femaleForm`) |
| `sentence-fill` | emoji + pronoun | pick the conjugated verb form (4 choices) | `verbs` |

- **`src/lib/questionTypes/<type>.js`** — the logic half. Exports `type` (a string id), `generate(context, avoidWordId) -> Question`, and `isCorrect(question, answer) -> boolean`. `context` is the `{ words, verbs, compounds, phrases }` object from `buildLessonContext` — each module reads whichever field(s) it needs.
- **`src/lib/questionTypes/index.js`** — the registry. `generateQuestion(type, context, avoidWordId)` and `checkAnswer(question, answer)` dispatch to the right module by `question.type`. This is the only file that needs a new line added when a question type is added.
- **`src/components/questions/<Type>Question.jsx`** — the rendering half: takes `{ question, feedback, onAnswer }` and renders the prompt + answer UI, calling `onAnswer(answer)` when the player responds. `feedback` is `{ correct, answer }` once one has been submitted, or `null` before that.
- **`src/components/questions/index.jsx`** — the component registry (`QuestionRenderer`), keyed the same way as the logic registry above. It renders with `key={question.id}` so any question-local UI state (e.g. `TypeInQuestion`'s text input) resets between questions, even two of the same type back to back.

`Lesson.jsx` only ever calls `generateQuestion`, `checkAnswer`, and renders `<QuestionRenderer />` — it has no `if (type === ...)` branches, so it doesn't grow as question types are added. New types don't appear in every lesson from the moment they're registered, either — see `activeQuestionTypes` in [design.md](design.md#question-types) for the unlock progression. See [data-model.md](data-model.md#question-schema) for the exact `Question`/`Answer` shape.

## Lesson flow

![Lesson flow diagram](images/lesson-flow.png)

A lesson is 10 questions minimum. At question 10, the running correct-count decides whether it extends — see [design.md](design.md#lesson-length-and-the-extend-rule) for the exact rule and the reasoning behind it.

## Debug mode

`isDebugMode()` (`src/lib/debug.js`) checks the URL for `?debug=true` on every render — it's not a persisted setting, so it never leaks into a normal session and there's nothing to remember to turn back off. When it's on, `Home.jsx` renders a "Debug" button alongside export/import that opens `DebugMenu.jsx`: a plain list of every question type (`ALL_QUESTION_TYPES` in `lessons.js`), regardless of whether a real player would have unlocked it yet.

Picking a type starts a normal `Lesson` (same 10-question/extend-rule loop as any other lesson), but with two differences from `startLesson()`:
- `questionTypes` is `[type]` instead of `activeQuestionTypes(progress)`, so every question in the round is the one type being previewed, not a mix.
- The context comes from `buildDebugLessonContext()` instead of `buildLessonContext(progress)` — it fakes just enough history to unlock every `level` tier, so e.g. `gender-match` (which only draws from level-1/2 words with a `femaleForm`) can be previewed on a completely fresh profile with zero real lessons played.

Debug lessons are also tagged `isDebug: true` on the `view` state in `App.jsx`, which `completeLesson` checks first: a debug lesson never calls `recordLessonCompletion`, and finishing (or exiting) one returns straight to the debug menu instead of the results screen — previewing a question type shouldn't add fake entries to real lesson history, streak, or the heatmap.

## Content studio

`isStudioMode()` (`src/lib/debug.js`) checks the URL for `?studio=true`, the same pattern as debug mode but a separate flag — one previews question types, the other edits the data files, and there's no reason to couple them. When it's on, `Home.jsx` renders a "Studio" button that opens `Studio.jsx`: a form-based editor, per content bank (words/verbs/compounds/phrases), that writes straight back to the real `src/data/*.json` files using the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) — no manual copy-paste, no server. This only works in Chromium browsers (Chrome/Edge); `Studio.jsx` feature-detects (`supportsFileSystemAccess()` in `src/lib/studioFile.js`) and shows a plain message on unsupported browsers instead of a broken UI. A download-based fallback for those browsers is planned but not yet built.

The logic is split three ways, same separation as the rest of the app (pure logic in `src/lib/`, browser-API wrapper kept thin, component is just wiring):

- **`src/lib/studio.js`** — pure, unit-tested. `emptyDraft(bank)` gives a blank form for a bank; `draftToEntry(bank, draft)` converts the flat form state into the actual shape written to the JSON file (e.g. it only adds a `femaleForm` key at all if the checkbox is on and a word was actually typed, matching how the real data files only have that key where it applies); `entryToDraft(bank, entry)` is the inverse, used when clicking an existing entry in the list to edit it; `validateEntry(bank, entry, existingEntries, editingId)` checks required fields, a lowercase-hyphen-only `id`, and that the `id` isn't already used by a *different* entry.
- **`src/lib/studioPreview.js`** — pure, unit-tested. `previewQuestionFor(bank, entry, pool)` builds a real `Question` object (same shape `src/lib/questionTypes/` produces) for whatever's currently in the form, so the preview panel hands it straight to the actual `<QuestionRenderer />` — the exact same rendering code a real lesson uses, not a separate preview-only look-alike. Each bank previews as its "primary" type (`words` as `emoji-match`, or `gender-match` if the draft has a female form; `verbs` as `sentence-fill`; `compounds` as `compound-match`; `phrases` as `phrase-match`), with distractors drawn from whatever else is currently loaded in that bank.
- **`src/lib/studioFile.js`** — the thin File System Access API wrapper (`supportsFileSystemAccess()`, `openJsonFile(suggestedName)`, `writeJsonFile(handle, data)`). Not unit tested, same reasoning as `progressFile.js`'s `downloadProgress`: it's a real-browser-API call with nothing but wiring to test, verified manually instead (or with a mocked `window.showOpenFilePicker` in an end-to-end check, since Playwright can't drive the native OS file picker).

`Studio.jsx` keeps one file handle per bank per session (opening `words.json` once, then switching to the Verbs tab and back, doesn't ask again) and holds the loaded entries in memory — nothing is written to disk until "Save to disk" is clicked, so adding/editing several entries and reviewing them in the list first is normal, not risky.

## Progress export/import

`src/lib/progressFile.js` is plain, framework-free logic:

- `downloadProgress(progress)` — serializes the `progress` object to a JSON `Blob` and triggers a browser download via a throwaway `<a download>` element. No confirmation, since exporting is non-destructive.
- `parseProgressFile(file)` — reads a `File` (from a file `<input>`), `JSON.parse`s it, and validates the result actually has the progress shape (an array `history` of `{ completedAt, correct, total }` and an object `activityByDate` of `{ lessonsCompleted }`) before returning it. Throws a descriptive `Error` on anything that doesn't match, which `Home.jsx` catches and displays inline — nothing is ever applied to `progress` from an unvalidated file.

`Home.jsx` wires these to a hidden file `<input>` and a native `window.confirm()` (the only confirmation dialog in the app, since import is the only destructive action — it fully replaces `progress` via `replaceProgress`). See [data-model.md](data-model.md#progress-file-import--export) for the exact validation rules and [ux-ui.md](ux-ui.md#export--import-progress) for the UI.

## Tests

Everything under `src/lib/` (and its `questionTypes/` subfolder) is plain, framework-free logic — no DOM, no React — which makes it straightforward to unit test in isolation with [Vitest](https://vitest.dev), without needing a browser or React Testing Library. Each module has a co-located `*.test.js` file (e.g. `src/lib/dates.test.js` next to `dates.js`).

What's covered: the date/streak math (`dates.js`), shuffling and round-picking (`round.js`), emoji-variant selection (`emoji.js`), the difficulty ramp and question-type unlock schedule (`lessons.js`), progress file validation (`progressFile.js`), the `?debug=true`/`?studio=true` checks (`debug.js`), the content studio's draft/entry conversion, validation, and preview-question building (`studio.js`, `studioPreview.js`), and every question type's `generate`/`isCorrect` pair — most with small hand-written fixtures for clarity, plus one test (`questionTypes/index.test.js`) that runs every type against the real `words.json`/`verbs.json`/`compounds.json`/`phrases.json` banks as an end-to-end sanity check that the actual content is well-formed.

Deliberately not covered: React components (`src/components/`), `progressFile.js`'s `downloadProgress`, and `studioFile.js`'s File System Access API calls (all need a real DOM/browser API with nothing but wiring to test) — these are thin rendering/wiring layers verified manually in a real browser instead (or with a mocked `window.showOpenFilePicker`, for the studio's save flow), since the bulk of this app's actual bug surface (question generation, correctness checking, date math) lives in the logic layer above.

`npm test` runs the suite once; `npm run test:watch` re-runs on file changes. CI (`.github/workflows/deploy.yml`) runs `npm test` before `npm run build`, so a broken test blocks deployment the same way a broken build would.

## Why no backend

The two questions that usually justify a backend — "does progress need to sync across devices?" and "does someone need to log in?" — were both answered no. `useProgress.js` is the single seam to swap if that changes later: it already isolates all read/write of progress behind `progress`, `recordLessonCompletion`, and `replaceProgress`, so replacing `localStorage` with an API call wouldn't touch `Lesson.jsx`, `Home.jsx`, or `LessonResults.jsx`. Export/import (above) is the manual, no-backend stand-in for cross-device sync in the meantime.

## Folder structure

```
src/
  data/
    words.json          # noun/vocab bank
    verbs.json           # verb-conjugation bank
    compounds.json        # multi-emoji compound-concept bank
    phrases.json           # conversational prompt/reply bank
  hooks/
    useProgress.js       # persisted lesson history + daily activity
  lib/
    lessons.js            # pools, buildLessonContext(), activeQuestionTypes(), extend rule
    emoji.js               # pickEmoji() — random emoji variant per question
    questionTypes/
      emojiMatch.js         # emoji -> pick the word
      reverseMatch.js        # word -> pick the emoji
      phraseMatch.js           # conversational phrase -> pick the reply
      compoundMatch.js           # multiple emoji together -> pick the word/phrase
      typeIn.js                    # emoji -> type the word
      genderMatch.js                 # emoji + gender symbol -> pick the sex-matching word form
      sentenceFill.js                  # verb conjugation fill-in-the-blank
      index.js                           # question-type registry: generateQuestion(), checkAnswer()
    round.js               # pickRound() / shuffle()
    dates.js                # dateKey(), recentDays(), currentStreak()
    progressFile.js          # downloadProgress(), parseProgressFile()
    debug.js                  # isDebugMode(), isStudioMode()
    studio.js                   # content studio: draft <-> entry, validateEntry()
    studioPreview.js              # content studio: previewQuestionFor()
    studioFile.js                   # content studio: File System Access API wrapper
  components/
    Home.jsx                # home screen: streak + heatmap + New Lesson + export/import + Debug/Studio
    ActivityHeatmap.jsx      # calendar heatmap
    Lesson.jsx                # plays one lesson, question-type-agnostic
    DebugMenu.jsx              # debug mode: pick any question type directly
    Studio.jsx                   # content studio: add/edit data-file entries with live preview
    questions/
      EmojiMatchQuestion.jsx   # renders emoji-match
      ReverseMatchQuestion.jsx  # renders reverse-match
      PhraseMatchQuestion.jsx     # renders phrase-match
      CompoundMatchQuestion.jsx    # renders compound-match
      TypeInQuestion.jsx             # renders type-in
      GenderMatchQuestion.jsx          # renders gender-match
      SentenceFillQuestion.jsx           # renders sentence-fill
      optionClassName.js                   # shared correct/incorrect/disabled class logic
      index.jsx                             # component registry: <QuestionRenderer />
    OptionButton.jsx          # word-choice button (article + pt + gender)
    LessonResults.jsx          # post-lesson score + streak screen
    VersionBadge.jsx            # commit-SHA link, bottom corner, every screen
  App.jsx                      # screen router (home / lesson / debug / studio / results)
  App.css                       # all styling
  index.css                      # theme variables, base styles
```

(Not shown above: every file directly under `lib/` and `lib/questionTypes/` has a co-located `*.test.js` — see [Tests](#tests).)
