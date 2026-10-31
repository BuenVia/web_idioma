# idioma — content manager

A web app for creating, viewing, editing and deleting the **subjects**,
**lessons** and **vocabulary** used by the idioma Android app. It talks to the
Spring Boot backend described in [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md).

## Running it

1. Start the backend on `http://localhost:8080`.
2. `npm install` (first time only)
3. `npm start` and open http://localhost:3000

Locally, the `"proxy"` setting in `package.json` makes the dev server forward
API requests (e.g. `/es/subject/getall`) to port 8080, so no CORS is needed.

### Deploying (Render)

Set the environment variable `REACT_APP_API_URL` to the deployed API's URL
(e.g. `https://my-api.onrender.com`) and run `npm run build`. The value is
baked in at build time, so redeploy after changing it. The backend must allow
this app's origin via CORS. Add a rewrite rule `/*` → `/index.html` so
refreshing a page like `/subjects/5` works.

Tests: `CI=true npm test`

## How the code is organised

```
src/
  index.js            Starts React; wraps the app in the router + language/levels providers
  App.js              List of pages (routes)
  index.css           All styles. Colours etc. are CSS variables at the top
  api/                One file per backend resource — the ONLY place that calls fetch
    client.js           Shared fetch wrapper (adds language, handles errors/empty bodies)
    languages.js        GET /languages — the languages the backend supports
    levels.js           GET /levels — the CEFR levels (A1–C2) a subject can have
    categories.js
    subjects.js
    lessons.js
    vocab.js
  context/
    LanguageContext.js  Languages (from GET /languages) + the current one, saved in localStorage
    LevelsContext.js    CEFR levels (from GET /levels), loaded once at start-up
  pages/              Full screens
    CategoriesPage.js   Home page (/): categories with their subjects; create and rename
    SubjectsPage.js     /subjects: grid of subjects + "New subject"
    SubjectDetailPage.js One subject: edit name/level/category, delete, lesson, vocabulary
    VocabPage.js        /vocab: every word with its category, subject and level
                        (read-only; search + level filter)
  components/         Reusable pieces used by the pages
    Layout.js           Top bar + page frame
    LessonSection.js    View / write / edit / delete the subject's lesson
    VocabSection.js     Add, edit inline and delete words
    Modal.js, ConfirmDialog.js, ErrorMessage.js
    SubjectDialog.js    Create/edit a subject: name + level + category dropdowns
    LevelBadge.js       Small "B2" pill; hover shows the level's name
    CategoryNameDialog.js Create/rename a category
```

Data flow is deliberately simple: each page loads what it needs with the
functions in `src/api/`, keeps it in `useState`, and updates that state after a
successful save. There is no global store.

## Things to know about the backend

These are handled in `src/api/`, but are worth knowing if you add features:

- Every URL starts with the language (`/es/...`, `/ca/...`), except
  `GET /languages` and `GET /levels`. Languages and levels are never
  hard-coded in the app: both lists come from those two endpoints.
- Every subject has a CEFR level (`A1`–`C2`, uppercase). It's required on
  create; on update leave it out to keep it. Older subjects may have `null`,
  and a level can't be cleared once set. Vocab inherits its subject's level.
- A subject has **at most one** lesson. Creating a second gives a 500.
- Vocab and lesson create/update **require** `subjectId` in the body.
- Subject create returns `subjectId` instead of `id` (normalised in `api/subjects.js`).
- Deleting a subject also deletes its lesson and vocab.
- Categories can be created and renamed but **not deleted** (no endpoint).
- Subject update: leave out the category fields to keep the category, send
  `categoryId` to move it, or `removeCategory: true` to clear it (not both).

## Adding a learning mode later

The API layer and language context are independent of the "manage" screens, so
a learner-facing area (flashcards, quizzes, reading lessons) can be added as new
pages under e.g. `/learn`, registered in `App.js` and linked from the nav in
`components/Layout.js`, reusing `getAllSubjects` / `getSubject`.
