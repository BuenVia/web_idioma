# idioma — content manager

A web app for creating, viewing, editing and deleting the **subjects**,
**lessons** and **vocabulary** used by the idioma Android app. It talks to the
Spring Boot backend described in [`docs/API_ENDPOINTS.md`](docs/API_ENDPOINTS.md).

## Running it

1. Start the backend on `http://localhost:8080`.
2. `npm install` (first time only)
3. `npm start` and open http://localhost:3000

The backend sends no CORS headers, so the browser can't call it directly.
Instead, the `"proxy"` setting in `package.json` makes the dev server forward
API requests (e.g. `/es/subject/getall`) to port 8080. For production, serve
the built app (`npm run build`) from the same origin as the API, or put a
reverse proxy (e.g. nginx) in front of both.

Tests: `CI=true npm test`

## How the code is organised

```
src/
  index.js            Starts React; wraps the app in the router + language provider
  App.js              List of pages (routes)
  index.css           All styles. Colours etc. are CSS variables at the top
  api/                One file per backend resource — the ONLY place that calls fetch
    client.js           Shared fetch wrapper (adds language, handles errors/empty bodies)
    subjects.js
    lessons.js
    vocab.js
  context/
    LanguageContext.js  Current language (es / ca), saved in localStorage
  pages/              Full screens
    SubjectsPage.js     Grid of subjects + "New subject"
    SubjectDetailPage.js One subject: rename/delete, lesson, vocabulary
  components/         Reusable pieces used by the pages
    Layout.js           Top bar + page frame
    LessonSection.js    View / write / edit / delete the subject's lesson
    VocabSection.js     Add, edit inline and delete words
    Modal.js, ConfirmDialog.js, SubjectNameDialog.js, ErrorMessage.js
```

Data flow is deliberately simple: each page loads what it needs with the
functions in `src/api/`, keeps it in `useState`, and updates that state after a
successful save. There is no global store.

## Things to know about the backend

These are handled in `src/api/`, but are worth knowing if you add features:

- Every URL starts with the language: `/es/...` or `/ca/...`.
- A subject has **at most one** lesson. Creating a second gives a 500.
- Vocab and lesson create/update **require** `subjectId` in the body.
- Subject create returns `subjectId` instead of `id` (normalised in `api/subjects.js`).
- Deleting a subject also deletes its lesson and vocab.

## Adding a learning mode later

The API layer and language context are independent of the "manage" screens, so
a learner-facing area (flashcards, quizzes, reading lessons) can be added as new
pages under e.g. `/learn`, registered in `App.js` and linked from the nav in
`components/Layout.js`, reusing `getAllSubjects` / `getSubject`.
