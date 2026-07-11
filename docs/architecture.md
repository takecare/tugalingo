# Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| UI framework | React + Vite | Component-based, fast dev server, scales cleanly as more screens/modes get added. |
| State | React `useState`/`useMemo`, no external store | The state graph is small (current screen, current lesson's round/progress) — a store like Redux/Zustand would be overhead for this size. |
| Persistence | Browser `localStorage` | No login needed for a two-person project; progress just needs to survive a page reload on the same device/browser. |
| Content | Static JSON (`src/data/words.json`) | Word bank is hand-curated and small; no need for a database or CMS. |
| Hosting | Static site (Vercel/Netlify/GitHub Pages) | The whole app is a static bundle — no backend to run or pay for. |

## Component / data flow

![Architecture diagram](images/architecture.png)

- **`src/data/words.json`** is the word bank — pure data, no logic.
- **`src/lib/lessons.js`** decides what pool of words the *next* lesson draws from (`currentWordPool`) and the extend-past-10 rule — pure functions, no React.
- **`src/lib/round.js`** picks a random target word + 3 distractors from whatever pool it's handed.
- **`src/lib/dates.js`** has the date helpers shared by the progress hook and the home screen: `dateKey`, `lastNDays`, and `currentStreak`.
- **`src/hooks/useProgress.js`** owns everything persisted: the full history of completed lessons and which calendar days had activity. It exposes one write path — `recordLessonCompletion(correct, total)` — called exactly once, when a lesson finishes. Exiting a lesson early never calls it.
- **`src/App.jsx`** is a tiny screen router with three states: `home`, `lesson`, `results`. It's also where a lesson's word pool is picked (via `currentWordPool`) the moment "New Lesson" is pressed, and where the streak shown on the results screen is computed. No game logic lives here beyond that wiring.
- **`src/components/Home.jsx`** — the home screen: streak header, `ActivityHeatmap`, and the "New Lesson" button.
- **`src/components/Lesson.jsx`** — plays one lesson: the round loop, the question-10 extend check, the progress bar.
- **`src/components/OptionButton.jsx`** — presentational, unchanged since the original matching-game version.
- **`src/components/LessonResults.jsx`** — the post-lesson score screen, including the updated streak.

## Lesson flow

![Lesson flow diagram](images/lesson-flow.png)

A lesson is 10 questions minimum. At question 10, the running correct-count decides whether it extends — see [design.md](design.md#lesson-length-and-the-extend-rule) for the exact rule and the reasoning behind it.

## Why no backend

The two questions that usually justify a backend — "does progress need to sync across devices?" and "does someone need to log in?" — were both answered no. `useProgress.js` is the single seam to swap if that changes later: it already isolates all read/write of progress behind `progress` and `recordLessonCompletion`, so replacing `localStorage` with an API call wouldn't touch `Lesson.jsx`, `Home.jsx`, or `LessonResults.jsx`.

## Folder structure

```
src/
  data/
    words.json          # word bank
  hooks/
    useProgress.js       # persisted lesson history + daily activity
  lib/
    lessons.js            # currentWordPool(), extend rule
    round.js               # pickRound() / shuffle()
    dates.js                # dateKey(), lastNDays(), currentStreak()
  components/
    Home.jsx                # home screen: streak + heatmap + New Lesson
    ActivityHeatmap.jsx      # calendar heatmap
    Lesson.jsx                # plays one lesson
    OptionButton.jsx          # one word-choice button
    LessonResults.jsx          # post-lesson score + streak screen
  App.jsx                      # screen router (home / lesson / results)
  App.css                       # all styling
  index.css                      # theme variables, base styles
```
