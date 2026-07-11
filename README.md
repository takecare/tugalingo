# tugalingo

A small European Portuguese vocabulary game: match an emoji to the Portuguese word for it. Built as a focused, standalone learning tool — see [docs/design.md](docs/design.md) for the design decisions behind it.

![Idle screen](docs/images/screen-idle.png)

## Running it locally

Requires Node.js (18+).

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Other commands:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally to sanity-check it
```

## Deploying

`npm run build` produces a static `dist/` folder — deploy it to any static host:

- **Vercel**: `npx vercel` (or connect the repo in the Vercel dashboard) — no config needed, it auto-detects Vite.
- **Netlify**: `npx netlify deploy` with build command `npm run build` and publish directory `dist`.
- **GitHub Pages**: push `dist/` to a `gh-pages` branch, or use the `actions/deploy-pages` GitHub Action.

There's no backend and no environment variables to configure — progress is stored in the player's browser (`localStorage`), so any static host works.

## Docs

- [Architecture](docs/architecture.md) — stack, component/data flow, why no backend
- [Design](docs/design.md) — game design decisions, the gender-badge mechanic, scope cuts
- [UX / UI](docs/ux-ui.md) — screen-by-screen walkthrough with screenshots
- [Data model](docs/data-model.md) — word bank schema and progress schema, how to add words
