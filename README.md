# tugalingo

**Play it live: https://takecare.github.io/tugalingo/**

A small European Portuguese vocabulary game: match an emoji to the Portuguese word for it. Built as a focused, standalone learning tool — see [docs/design.md](docs/design.md) for the design decisions behind it.

![Home screen](docs/images/screen-home-with-streak.png)

Sign in with your email (a magic link, no password) to play — press "New Lesson" for a lesson of a minimum of 10 questions, extending to 12-14 if you score well on the first 10. A day streak and an activity heatmap track daily play; progress syncs automatically across devices via your account, and can also be exported/imported as a JSON file as a manual backup. See [docs/design.md](docs/design.md#streak--daily-activity) for the reasoning behind the streak, and [docs/design.md](docs/design.md#lesson-length-and-the-extend-rule) for the exact extend rule.

## Running it locally

Requires Node.js (18+) and a [Supabase](https://supabase.com) project (free tier) — copy `.env.example` to `.env` and fill in your project's URL/anon key after running `supabase/schema.sql` against it (this creates the `progress`, `profiles`, and `content_items` tables). The word/verb/compound/phrase banks start empty on a fresh project — seed them with `node scripts/seed-content.mjs > seed.sql && psql "$SUPABASE_DB_URL" -f seed.sql`. See [docs/architecture.md](docs/architecture.md#accounts--cloud-progress-sync) and [docs/architecture.md](docs/architecture.md#content-studio) for the details.

```bash
npm install
npm start
```

This opens the app in your default browser automatically. If you'd rather open it yourself, `npm run dev` does the same thing without launching a browser — just open the URL Vite prints (usually `http://localhost:5173`).

Other commands:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally to sanity-check it
npm test          # run the test suite once
npm run test:watch  # re-run tests on file changes
```

## Deploying

Deployed automatically to GitHub Pages by `.github/workflows/deploy.yml` — every push to `main` builds with Vite and publishes `dist/`. The build needs `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, set as GitHub Actions repo secrets (`gh secret set`) rather than committed.

To deploy elsewhere instead, `npm run build` produces the same static `dist/` folder, deployable to any static host (Vercel, Netlify, Cloudflare Pages, etc.) — just remember to drop or change the `base: '/tugalingo/'` path in `vite.config.js` if the site won't live under a `/tugalingo/` subpath.

## Docs

- [Architecture](docs/architecture.md) — stack, component/data flow, accounts & cloud progress sync
- [Design](docs/design.md) — game design decisions, the gender-badge mechanic, scope cuts
- [UX / UI](docs/ux-ui.md) — screen-by-screen walkthrough with screenshots
- [Data model](docs/data-model.md) — word bank schema and progress schema, how to add words
