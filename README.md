# tugalingo

**Play it live: https://takecare.github.io/tugalingo/**

A small European Portuguese vocabulary game: match an emoji to the Portuguese word for it. Built as a focused, standalone learning tool — see [docs/design.md](docs/design.md) for the design decisions behind it.

![Home screen](docs/images/screen-home-with-streak.png)

Press "New Lesson" to play — each lesson is a minimum of 10 questions, extending to 12-14 if you score well on the first 10. A day streak and an activity heatmap track daily play; progress is saved in the browser. See [docs/design.md](docs/design.md#streak--daily-activity) for the reasoning behind the streak, and [docs/design.md](docs/design.md#lesson-length-and-the-extend-rule) for the exact extend rule.

## Running it locally

Requires Node.js (18+).

```bash
npm install
npm start
```

This opens the app in your default browser automatically. If you'd rather open it yourself, `npm run dev` does the same thing without launching a browser — just open the URL Vite prints (usually `http://localhost:5173`).

Other commands:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally to sanity-check it
```

## Deploying

Deployed automatically to GitHub Pages by `.github/workflows/deploy.yml` — every push to `main` builds with Vite and publishes `dist/`. No secrets or environment variables to configure.

To deploy elsewhere instead, `npm run build` produces the same static `dist/` folder, deployable to any static host (Vercel, Netlify, Cloudflare Pages, etc.) — just remember to drop or change the `base: '/tugalingo/'` path in `vite.config.js` if the site won't live under a `/tugalingo/` subpath.

## Docs

- [Architecture](docs/architecture.md) — stack, component/data flow, why no backend
- [Design](docs/design.md) — game design decisions, the gender-badge mechanic, scope cuts
- [UX / UI](docs/ux-ui.md) — screen-by-screen walkthrough with screenshots
- [Data model](docs/data-model.md) — word bank schema and progress schema, how to add words
