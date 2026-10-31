# Language API — front-end reference

Reference for building a client against the language-learning backend (Spring Boot, version 1.0.4). Every request and response shape below was checked against a running instance. Where the backend has a quirk or bug the client needs to work around, it's called out under **⚠**.

---

## 1. Basics

| Item | Value |
|---|---|
| Base URL (local) | `http://<host>:8080` (binds `0.0.0.0`) |
| Base URL (production) | Deployed via Docker; port from `PORT` env var. Host depends on deployment. |
| Auth | **None.** All endpoints are open. |
| Request content type | `Content-Type: application/json` for every `POST`/`PUT` |
| Response content type | `application/json`, except `204 No Content` responses and empty `200` (see `lesson/getbysubject`) |
| Pagination / sorting / filtering | **None.** List endpoints return everything for the language, in database (insertion/id) order. Sort and group on the client. Exception: `vocab/getallgrouped` is grouped and sorted on the server. |
| CORS | **⚠ Not configured.** The server sends no `Access-Control-Allow-*` headers. A browser app served from a different origin will have its requests blocked. Use a dev-server proxy, or a native/mobile client; otherwise the backend needs CORS config added. The deployed web app (Render) calls the API cross-origin, so the deployed backend must allow its origin. |

### Language scoping

Every route except `GET /languages` and `GET /levels` starts with a language segment: `/{language}/...`

| Value | Language |
|---|---|
| `es` | Castilian Spanish |
| `ca` | Catalan |

- The table above is the current list; **`GET /languages`** returns it at runtime, so the client doesn't have to hard-code it (see below).
- Case-insensitive (`es`, `ES` and `Es` all work).
- Any other value returns **400**.
- Subjects and categories belong to exactly one language. Vocab and lessons inherit the language of their subject.
- Asking for an id under the wrong language returns **404**, as if it doesn't exist. **⚠** Exception: some lesson endpoints (see §6).

### `GET /languages`

The supported languages. The response is built from the backend's `Language` enum, so it always matches what the `/{language}` segment accepts. Returns `LanguageInfo[]`:
```json
[
  { "code": "es", "name": "Castilian Spanish" },
  { "code": "ca", "name": "Catalan" }
]
```
- `code` is the value to put in the URL (always lowercase).
- `name` is an English display name.
- Order is fixed (the enum's declaration order); a language added on the backend appears here after deploy, with no client change needed to list it.
- `Subject.language` in subject responses is the same code in **uppercase** (`"ES"`), so compare case-insensitively.

### `GET /levels`

The CEFR levels a subject can have. The response is built from the backend's `Level` enum, so it always matches what subject `create`/`update` accept in `level`. Not language-scoped. Returns `LevelInfo[]`:
```json
[
  { "code": "A1", "name": "Beginner" },
  { "code": "A2", "name": "Elementary" },
  { "code": "B1", "name": "Intermediate" },
  { "code": "B2", "name": "Upper Intermediate" },
  { "code": "C1", "name": "Advanced" },
  { "code": "C2", "name": "Proficient" }
]
```
- `code` is the value to send as `level` on subject `create`/`update`, and the value returned in `level` fields (always uppercase).
- `name` is an English display name for the option label.
- Order is fixed (A1 → C2, the enum's declaration order).

### Routing style

Routes are RPC-style, not REST: `/getall`, `/get/{id}`, `/create`, `/update/{id}`, `/delete/{id}`, plus a few specials. IDs are integers. A non-numeric id returns **400**.

### Response shapes vary by endpoint

Some endpoints return a full entity and others a slimmer DTO, so the **same resource has different shapes on different endpoints** (e.g. vocab from `get/{id}` includes `subjectId`; vocab from `getall`/`create`/`update` does not). Each endpoint's shape is listed explicitly below. Don't assume one shared type per resource.

---

## 2. Data model

```
Category (per language) 1 ──── * Subject (per language) 1 ──── * Vocab
                                         │
                                         1 ──── 0..1 Lesson
```

- A **Subject** may have **no category** (`category: null`). Categories are created and renamed through the category endpoints (§3); there is no category delete. A subject is assigned to, moved between, or removed from a category through the subject `create`/`update` endpoints (§4).
- A **Subject** has **at most one Lesson**.
- A **Subject** has a CEFR **level** (`A1`–`C2`). It is required when creating a subject, so it is only `null` for older subjects that were never given one. Vocab and lessons have no level of their own; they belong to their subject's level.
- Deleting a Subject also deletes its vocab and lesson.

### TypeScript types

```ts
type Language = 'es' | 'ca';         // current values of LanguageInfo.code

interface LanguageInfo {             // GET /languages items
  code: Language;                    // URL segment, lowercase
  name: string;                      // English display name, e.g. "Castilian Spanish"
}

type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';   // CEFR level; always uppercase

interface LevelInfo {                // GET /levels items
  code: Level;                       // value for subject create/update `level`
  name: string;                      // English display name, e.g. "Upper Intermediate"
}

// ---- Category ----
interface CategorySummary {          // category/getcategorynames items, category/create, category/update; embedded in subject responses
  id: number;
  categoryName: string;
}
interface CategoryRequest {          // category/create and category/update/{id} request body
  categoryName: string;              // required: omitting it stores null
}
interface CategoryDetail {           // category/get/{id}
  id: number;
  categoryName: string;
  subjects: { id: number; subjectName: string }[];
}

// ---- Subject ----
interface SubjectSummary {           // subject/getsubjectnames items
  id: number;
  subjectName: string;
  level: Level | null;
  category: CategorySummary | null;
}
interface Subject {                  // subject/getall items, subject/get/{id}, subject/update/{id}
  id: number;
  subjectName: string;
  language: 'ES' | 'CA';             // NOTE: uppercase here, unlike the URL segment
  level: Level | null;
  category: CategorySummary | null;
  lesson: LessonEntity | null;
  vocabs: VocabEntity[];
}
interface SubjectCreated {           // subject/create
  subjectId: number;                 // NOTE: "subjectId", not "id"
  subjectName: string;
  level: Level;                      // always set (required on create)
  category: CategorySummary | null;
}
interface CreateSubjectRequest {
  subjectName: string;
  level: Level;                      // required: omitting it → 400
  categoryId?: number;               // optional; must be a category of the same language
}
interface UpdateSubjectRequest {
  subjectName: string;               // required: omitting it sets the name to null
  level?: Level;                     // optional; omit to leave unchanged (cannot be cleared)
  categoryId?: number;               // optional; set/move category. Omit to leave unchanged
  removeCategory?: boolean;          // optional; true clears the category. Not allowed with categoryId
}

// ---- Vocab ----
interface VocabEntity {              // vocab/getall, vocab/create, vocab/update, Subject.vocabs
  id: number;
  term: string;
  translation: string;
}
interface VocabDetail extends VocabEntity {   // vocab/get/{id}
  subjectId: number;
  level: Level | null;               // the subject's level
}
interface VocabCategoryGroup {       // vocab/getallgrouped items
  categoryId: number | null;         // null (with categoryName null) = uncategorised subjects
  categoryName: string | null;
  subjects: {
    subjectId: number;
    subjectName: string;
    level: Level | null;
    vocabs: VocabEntity[];
  }[];
}

// ---- Lesson ----
interface LessonEntity {             // lesson/getbysubject, lesson/create, lesson/update, Subject.lesson
  id: number;
  lessonTitle: string;
  body: string;                      // Markdown
  createdAt: string;                 // ISO-8601 UTC, e.g. "2026-10-31T14:18:26.336Z"
}
interface LessonDetail {             // lesson/get/{id}
  id: number;
  lessonTitle: string;
  body: string;
  subjectId: number;                 // NOTE: no createdAt on this endpoint
}

// ---- Errors ----
interface NotFoundError {            // all 404s
  status: 404;
  message: string;                   // e.g. "Subject not found with id: 8"
  timestamp: string;                 // server-local time, no timezone, e.g. "2026-10-31T15:18:26.245895727"
}
interface SpringError {              // 400 / 500 (framework default)
  timestamp: string;                 // ISO-8601 UTC
  status: number;
  error: string;                     // "Bad Request", "Internal Server Error"
  path: string;
}
```

---

## 3. Category — `/{language}/category`

List, get, create and rename. **There is no delete endpoint.**

### `GET /{language}/category/getcategorynames`

All categories for the language. Returns `CategorySummary[]`.

```json
[ { "id": 1, "categoryName": "Food" } ]
```

### `GET /{language}/category/get/{id}`

One category with the id and name of each of its subjects (only subjects in the same language). Returns `CategoryDetail`.

```json
{
  "id": 1,
  "categoryName": "Food",
  "subjects": [
    { "id": 1, "subjectName": "Indicativo y Subjuntivo" },
    { "id": 4, "subjectName": "test" }
  ]
}
```

`subjects` is `[]` if the category has none. **404** if the id doesn't exist in this language.

### `POST /{language}/category/create`

Request (`CategoryRequest`):
```json
{ "categoryName": "Grammar" }
```
Response `CategorySummary` (**200**, not 201):
```json
{ "id": 3, "categoryName": "Grammar" }
```
The category is created in the URL's language and starts with no subjects. To add subjects, use `categoryId` on subject `create`/`update` (§4).

### `PUT /{language}/category/update/{id}`

Renames a category. Request (`CategoryRequest`):
```json
{ "categoryName": "Grammar & Usage" }
```
Response `CategorySummary`:
```json
{ "id": 3, "categoryName": "Grammar & Usage" }
```
- **404** if the category doesn't exist in this language (a category can't be edited through the other language's URL).
- The category's subjects are unaffected. Subject responses pick up the new name automatically.
- **⚠ Not a partial update / no validation.** Omitting `categoryName` (or sending `""`) stores `null`/empty. Validate on the client.
- The response does not include `subjects`. Call `category/get/{id}` if you need them.

---

## 4. Subject — `/{language}/subject`

### `GET /{language}/subject/getsubjectnames`

Lightweight list for menus/navigation. Returns `SubjectSummary[]`.

```json
[
  { "id": 1, "subjectName": "Indicativo y Subjuntivo", "level": "B2", "category": { "id": 1, "categoryName": "Food" } },
  { "id": 7, "subjectName": "General 2", "level": "B2", "category": null }
]
```

### `GET /{language}/subject/getall`

Every subject **with its full lesson and vocab list**. Returns `Subject[]`. This can be a large payload; prefer `getsubjectnames` for lists.

### `GET /{language}/subject/get/{id}`

One subject with its lesson and vocab. Returns `Subject`. **404** if not found in this language.

```json
{
  "id": 1,
  "subjectName": "Indicativo y Subjuntivo",
  "language": "ES",
  "level": "B2",
  "category": { "id": 1, "categoryName": "Food" },
  "lesson": {
    "id": 1,
    "lessonTitle": "Test Note",
    "body": "## Expresar gustos\n\n| Regla | Ejemplo |\n|---|---|\n...",
    "createdAt": "2026-10-25T06:10:18.684Z"
  },
  "vocabs": [
    { "id": 3, "term": "Me fascina que digas eso", "translation": "It fascinates me that you say that" }
  ]
}
```

### `POST /{language}/subject/create`

Request (`CreateSubjectRequest`):
```json
{ "subjectName": "Food vocab", "level": "B2", "categoryId": 1 }
```
`categoryId` is optional. Omit it (or send `null`) to create the subject with no category.
`level` is **required**. It must be one of `A1`, `A2`, `B1`, `B2`, `C1`, `C2` in **uppercase**. Omitting it, sending `null`, or any other value (including lowercase `"b2"`) → **400** (generic `SpringError` body); nothing is created.

Response `SubjectCreated` (**200**, not 201):
```json
{ "subjectId": 9, "subjectName": "Food vocab", "level": "B2", "category": { "id": 1, "categoryName": "Food" } }
```
The subject is created in the URL's language. **404** `"Category not found with id: …"` if `categoryId` doesn't exist **in this language**.

### `PUT /{language}/subject/update/{id}`

Request (`UpdateSubjectRequest`):
```json
{ "subjectName": "Docs Test 2" }                              // category left unchanged
{ "subjectName": "Docs Test 2", "categoryId": 1 }             // set or move category
{ "subjectName": "Docs Test 2", "removeCategory": true }      // remove from its category
{ "subjectName": "Docs Test 2", "level": "B1" }               // change level (category unchanged)
```
Response: the full `Subject` (including the resulting `category` and `level`).

| Case | Result |
|---|---|
| `categoryId` omitted/`null`, `removeCategory` omitted/`false` | Category **unchanged** |
| `categoryId: n` | Category set to `n` |
| `removeCategory: true` | Category set to `null` |
| both `categoryId` and `removeCategory: true` | **400** (generic `SpringError` body, no message); nothing is changed |
| `categoryId` not found in this language | **404** `"Category not found with id: …"` |
| subject id not found in this language | **404** `"Subject not found with id: …"` |
| `level` omitted/`null` | Level **unchanged** |
| `level: "A1"` … `"C2"` | Level set |
| `level` not a valid uppercase level | **400** (generic `SpringError` body); nothing is changed |

**⚠ `subjectName` is not partial.** Omitting it sets it to `null`, so always send it. (Category fields and `level` *are* partial: omitting them keeps the current value. A level can be changed but not cleared back to `null`.)

### `DELETE /{language}/subject/delete/{id}`

**204**, empty body. **Also deletes the subject's vocab and lesson.** There is no confirmation step server-side, so the client should confirm with the user. **404** if not found in this language.

---

## 5. Vocab — `/{language}/vocab`

### `GET /{language}/vocab/getall`

All vocab for the language, across all subjects. Returns `VocabEntity[]`. **⚠ No `subjectId`** on these items. To get vocab grouped by category and subject, use `vocab/getallgrouped`.

### `GET /{language}/vocab/getallgrouped`

All vocab for the language, grouped by category and then by subject. Returns `VocabCategoryGroup[]`:
```json
[
  { "categoryId": 2, "categoryName": "Grammar", "subjects": [
      { "subjectId": 4, "subjectName": "test", "level": "B2", "vocabs": [
          { "id": 7, "term": "estoy interesado", "translation": "I am interested" } ] } ] },
  { "categoryId": null, "categoryName": null, "subjects": [
      { "subjectId": 1, "subjectName": "Indicativo y Subjuntivo", "level": "B2", "vocabs": [
          { "id": 3, "term": "Me fascina que digas eso", "translation": "It fascinates me that you say that" } ] } ] }
]
```
- Unlike the other list endpoints, this one **is sorted**: categories by name (case-insensitive), then the uncategorised group (`categoryId: null`) last; subjects by name within each category; vocab by id within each subject.
- Only subjects that have vocab appear, and only categories that contain such subjects. Use `subject/getsubjectnames` / `category/getcategorynames` for complete lists.
- Each subject carries its `level` (`null` if it has none). The response is not grouped or sorted by level; filter on the client.
- No uncategorised group if every subject with vocab has a category. Empty array if the language has no vocab.

### `GET /{language}/vocab/get/{id}`

Returns `VocabDetail`:
```json
{ "id": 8, "level": "B2", "subjectId": 8, "term": "hola", "translation": "hello" }
```
`level` is the level of the vocab's subject (`null` if the subject has none).
**404** if not found. **⚠** The 404 message says `"Subject not found with id: …"` even though it's the vocab that's missing.

### `POST /{language}/vocab/create`

Request (all fields required):
```json
{ "term": "hola", "translation": "hello", "subjectId": 8 }
```
Response `VocabEntity` (**200**):
```json
{ "id": 8, "term": "hola", "translation": "hello" }
```
**404** if `subjectId` doesn't exist in this language. **⚠** The message says `"Vocab not found with id: <subjectId>"`.

### `PUT /{language}/vocab/update/{id}`

Request: **all fields required**, including `subjectId`. That field is how a vocab moves to another subject; send the current one to keep it.
```json
{ "term": "adios", "translation": "bye", "subjectId": 8 }
```
Response `VocabEntity`.
- Omitting `subjectId` → **404** `"Subject not found with id: null"`.
- Omitting `term`/`translation` sets them to `null` (not a partial update).
- **404** if the vocab or subject isn't found in this language.

### `DELETE /{language}/vocab/delete/{id}`

**204**, empty body. **404** if not found in this language.

---

## 6. Lesson — `/{language}/lesson`

A subject has **at most one** lesson. `body` is **Markdown** (headings, tables, etc.) and should be rendered as such.

### `GET /{language}/lesson/get/{id}`

By **lesson** id. Returns `LessonDetail` (has `subjectId`, **no `createdAt`**):
```json
{ "id": 7, "lessonTitle": "T", "body": "# Hi", "subjectId": 8 }
```
**404** if not found in this language.

### `GET /{language}/lesson/getbysubject/{subjectId}`

By **subject** id. Returns `LessonEntity` (has `createdAt`, **no `subjectId`**):
```json
{ "id": 7, "lessonTitle": "T", "body": "# Hi", "createdAt": "2026-10-31T14:18:26.336Z" }
```
- **⚠ If the subject has no lesson: `200` with an empty body** (no JSON, no content type). Check for an empty body before `response.json()`, or it will throw.
- **404** if the subject id doesn't exist at all.

### `POST /{language}/lesson/create`

Request:
```json
{ "lessonTitle": "T", "body": "# Hi", "subjectId": 8 }
```
Response `LessonEntity` (**200**). `createdAt` is set by the server; any value sent is ignored.
- **⚠ A subject already having a lesson → `500 Internal Server Error`** (unique constraint). Check `subject.lesson === null` first, or use `update` instead.
- **404** if `subjectId` doesn't exist.

### `PUT /{language}/lesson/update/{id}`

Request: **all fields required**. `subjectId` reassigns the lesson, so send the current one to keep it.
```json
{ "lessonTitle": "T3", "body": "b", "subjectId": 8 }
```
Response `LessonEntity`. Omitted `lessonTitle`/`body` become `null`. **404** if the lesson isn't found in this language or the subject doesn't exist.

### `DELETE /{language}/lesson/delete/{id}`

By **lesson** id. **204**, empty body. The subject remains. **404** if not found in this language.

### ⚠ Known cross-language leak

`lesson/getbysubject`, `lesson/create` and the `subjectId` lookup in `lesson/update` **don't check the language** of the subject. For example, `/ca/lesson/getbysubject/1` returns the lesson of Spanish subject 1. The client should only pass subject ids it got from the same language. This is a known backend bug (`docs/CODE_REVIEW.md` item 5.5).

---

## 7. Errors and status codes

| Status | When | Body |
|---|---|---|
| 200 | Successful GET/POST/PUT | JSON (or empty for `lesson/getbysubject` with no lesson) |
| 204 | Successful DELETE | empty |
| 400 | Unknown language segment, non-numeric id, malformed JSON, missing or invalid `level` on subject create, invalid `level` on subject update, `categoryId` + `removeCategory` together on subject update | `SpringError` |
| 404 | Id not found (in this language) | `NotFoundError` |
| 500 | Server error; notably creating a second lesson for a subject | `SpringError` |

- There is **no validation**: empty strings, missing fields and `null`s are accepted and stored (except where a missing id causes a 404). Validate on the client.
- 404 `message` text is not always accurate about *which* resource is missing (see vocab notes), so key UI behaviour off the status code, not the message.
- The two error shapes differ (`message` vs `error`), so handle both.

---

## 8. Endpoint summary

| Method | Path | Request body | Response |
|---|---|---|---|
| GET | `/languages` | – | `LanguageInfo[]` |
| GET | `/levels` | – | `LevelInfo[]` |
| GET | `/{lang}/category/getcategorynames` | – | `CategorySummary[]` |
| GET | `/{lang}/category/get/{id}` | – | `CategoryDetail` |
| POST | `/{lang}/category/create` | `{categoryName}` | `CategorySummary` |
| PUT | `/{lang}/category/update/{id}` | `{categoryName}` | `CategorySummary` |
| GET | `/{lang}/subject/getsubjectnames` | – | `SubjectSummary[]` |
| GET | `/{lang}/subject/getall` | – | `Subject[]` |
| GET | `/{lang}/subject/get/{id}` | – | `Subject` |
| POST | `/{lang}/subject/create` | `{subjectName, level, categoryId?}` | `SubjectCreated` |
| PUT | `/{lang}/subject/update/{id}` | `{subjectName, level?, categoryId?, removeCategory?}` | `Subject` |
| DELETE | `/{lang}/subject/delete/{id}` | – | 204 |
| GET | `/{lang}/vocab/getall` | – | `VocabEntity[]` |
| GET | `/{lang}/vocab/getallgrouped` | – | `VocabCategoryGroup[]` |
| GET | `/{lang}/vocab/get/{id}` | – | `VocabDetail` |
| POST | `/{lang}/vocab/create` | `{term, translation, subjectId}` | `VocabEntity` |
| PUT | `/{lang}/vocab/update/{id}` | `{term, translation, subjectId}` | `VocabEntity` |
| DELETE | `/{lang}/vocab/delete/{id}` | – | 204 |
| GET | `/{lang}/lesson/get/{id}` | – | `LessonDetail` |
| GET | `/{lang}/lesson/getbysubject/{subjectId}` | – | `LessonEntity` or empty |
| POST | `/{lang}/lesson/create` | `{lessonTitle, body, subjectId}` | `LessonEntity` |
| PUT | `/{lang}/lesson/update/{id}` | `{lessonTitle, body, subjectId}` | `LessonEntity` |
| DELETE | `/{lang}/lesson/delete/{id}` | – | 204 |

---

## 9. Suggested client patterns

- **Language picker:** populate it from `GET /languages` at start-up and use each `code` as the URL segment. Keep the `Language` TypeScript type for compile-time checks, but treat the endpoint as the authority on which languages exist.

- **Navigation / home screen:** `subject/getsubjectnames`, then group by `category` on the client (subjects with `category: null` go in an "Uncategorised" group). Alternatively, use `category/getcategorynames` plus `category/get/{id}` per category, but that misses uncategorised subjects.
- **Subject page:** `subject/get/{id}` returns everything (lesson and vocab) in one call.
- **Editing forms:** always send every field on `update`, pre-filled from the current values. Populate the level picker from `GET /levels` (use `name` as the label and send `code` as `level`). For subjects, send `categoryId` only when the user changed the category, and `removeCategory: true` when they cleared it. Populate the category picker from `category/getcategorynames` for the current language.
- **Creating a category and adding subjects:** `category/create` → take the returned `id` → send it as `categoryId` on subject `create`/`update`. After a category rename, refetch `getsubjectnames` (or patch your cache), since each subject embeds the category name.
- **Language switch:** the language is part of every URL. Clear cached ids when switching, because ids from one language return 404 in the other (or leak, for lessons).
