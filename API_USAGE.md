# API endpoint usage

Which endpoints from [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) the app calls, and which it doesn't.
Of the 23 documented endpoints, 18 are used and 5 are not.

All `fetch` calls go through `src/api/`. "Used in" lists the files outside `src/api/` (not counting tests) that call each API function.

## Endpoints in use (18)

| Method | Endpoint | API function | Used in |
|---|---|---|---|
| GET | `/languages` | `getLanguages` | `src/context/LanguageContext.js` |
| GET | `/levels` | `getLevels` | `src/context/LevelsContext.js` |
| GET | `/{lang}/category/getcategorynames` | `getCategoryNames` | `src/pages/CategoriesPage.js`, `src/components/SubjectDialog.js` |
| POST | `/{lang}/category/create` | `createCategory` | `src/pages/CategoriesPage.js` |
| PUT | `/{lang}/category/update/{id}` | `updateCategory` | `src/pages/CategoriesPage.js` |
| GET | `/{lang}/subject/getsubjectnames` | `getSubjectNames` | `src/pages/CategoriesPage.js` |
| GET | `/{lang}/subject/getall` | `getAllSubjects` | `src/pages/SubjectsPage.js` |
| GET | `/{lang}/subject/get/{id}` | `getSubject` | `src/pages/SubjectDetailPage.js` |
| POST | `/{lang}/subject/create` | `createSubject` | `src/pages/SubjectsPage.js` |
| PUT | `/{lang}/subject/update/{id}` | `updateSubject` | `src/pages/SubjectDetailPage.js` |
| DELETE | `/{lang}/subject/delete/{id}` | `deleteSubject` | `src/pages/SubjectDetailPage.js` |
| GET | `/{lang}/vocab/getallgrouped` | `getAllVocabGrouped` | `src/pages/VocabPage.js` |
| POST | `/{lang}/vocab/create` | `createVocab` | `src/components/VocabSection.js` |
| PUT | `/{lang}/vocab/update/{id}` | `updateVocab` | `src/components/VocabSection.js` |
| DELETE | `/{lang}/vocab/delete/{id}` | `deleteVocab` | `src/components/VocabSection.js` |
| POST | `/{lang}/lesson/create` | `createLesson` | `src/components/LessonSection.js` |
| PUT | `/{lang}/lesson/update/{id}` | `updateLesson` | `src/components/LessonSection.js` |
| DELETE | `/{lang}/lesson/delete/{id}` | `deleteLesson` | `src/components/LessonSection.js` |

## Endpoints documented but not used (5)

| Method | Endpoint | Has an API function? | Why it isn't needed |
|---|---|---|---|
| GET | `/{lang}/category/get/{id}` | No | The Categories page builds each category's subject list from `subject/getsubjectnames` in one call, which also picks up uncategorised subjects. |
| GET | `/{lang}/vocab/getall` | Yes, `getAllVocab`, but nothing calls it | The Vocabulary page uses `vocab/getallgrouped`, which also gives each word's subject, category and level. |
| GET | `/{lang}/vocab/get/{id}` | No | Words are only shown and edited inside their subject, and `subject/get/{id}` already includes them. |
| GET | `/{lang}/lesson/get/{id}` | No | The lesson comes nested in `subject/get/{id}`. |
| GET | `/{lang}/lesson/getbysubject/{subjectId}` | No | Same reason: the lesson is already in the subject response. The API reference also notes this endpoint doesn't check the language. |

`getAllVocab` in `src/api/vocab.js` is currently dead code. It's kept in case a learner-facing mode needs a flat word list later.
