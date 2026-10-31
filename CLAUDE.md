# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

`idioma` is a Create React App project (react-scripts 5.0.1, React 19, React Router 7) that manages content (subjects, lessons, vocab) for a language-learning Android app. It is a client for the Spring Boot API documented in `docs/API_REFERENCE.md` — read that before touching `src/api/`. `README.md` describes the folder layout. The code is meant to be readable by a junior developer: keep it plain (useState/useEffect, no global store, one CSS file), and comment non-obvious backend quirks.

## Architecture

- `src/api/` is the only place that calls `fetch`. `client.js#request(language, path, opts)` prefixes `/{language}`, sets JSON headers, maps error statuses to friendly messages (backend 404 messages are often wrong — don't surface them), and returns `null` for empty bodies (204 deletes, `lesson/getbysubject` with no lesson).
- `client.js` prefixes every URL with `process.env.REACT_APP_API_URL` (build-time). Locally it's unset, so requests are relative and the `"proxy"` field in `package.json` forwards them to `http://localhost:8080`. On Render it's set to the deployed API URL, and the backend allows the web app's origin via CORS.
- Languages and CEFR levels are never hard-coded: `src/context/LanguageContext.js` loads `GET /languages` and holds the current one (persisted to localStorage); `src/context/LevelsContext.js` loads `GET /levels` once. These two routes aren't language-scoped, so they use `client.js#send(url)` instead of `request`. `Layout` shows no page until languages have loaded (so `language` is never null in pages) and navigates to `/` on language switch because subjects are language-scoped.
- Level lives on the subject (required on create, optional/unclearable on update); vocab inherits it.
- Routes (in `App.js`): `/` → `CategoriesPage` (the home page; create/rename only — the API has no category delete), `/subjects` → `SubjectsPage`, `/subjects/:id` → `SubjectDetailPage`, `/vocab` → `VocabPage` (read-only; flattens `vocab/getallgrouped` so each word shows its category, subject and level). The detail page fetches the full subject once and child sections (`LessonSection`, `VocabSection`) report saves via `onChange` so the parent updates state without refetching.
- Styles: everything in `src/index.css`, colour tokens on `:root` with a `prefers-color-scheme: dark` override.
- The user may later add a learner-facing mode (e.g. `/learn`); keep the API layer independent of the management UI.

## Commands

- `npm start` — dev server at http://localhost:3000 with hot reload; needs the backend on :8080 for data.
- `npm run build` — production build into `build/`.
- `npm test` — Jest in interactive watch mode.
  - Run once, non-interactively: `CI=true npm test`
  - Run a single test file: `CI=true npm test -- src/App.test.js`
  - Filter by test name: `CI=true npm test -- -t "renders"`
- Linting is ESLint through react-scripts (`react-app` and `react-app/jest` configs in `package.json`). There is no separate lint script; run `npx eslint src` to lint directly.
- Do not run `npm run eject` — it is irreversible.

## Testing

Jest + React Testing Library. `src/setupTests.js` loads jest-dom and polyfills `TextEncoder`/`TextDecoder` (React Router 7 needs them; CRA's jsdom lacks them). `src/App.test.js` drives the main flow against an in-memory fake `fetch`. Put test files next to source as `*.test.js`.

Gotchas:
- Import from `react-router`, not `react-router-dom`: CRA's Jest 27 can't resolve `react-router-dom`'s package `exports` (`react-router/dom`).
- `markdown-to-jsx` is pinned to v7: v9 imports itself via package `exports` (`markdown-to-jsx/entities`), which Jest 27 can't resolve.
- `@testing-library/user-event` is v13 — no `userEvent.setup()`; call `userEvent.click/type` directly.
