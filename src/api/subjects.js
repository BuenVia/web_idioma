// Subject endpoints — see docs/API_REFERENCE.md §4.
import { request } from './client';

// Full subjects, each with its nested `lesson` (or null) and `vocabs` array.
export function getAllSubjects(language) {
  return request(language, '/subject/getall');
}

// Lightweight list for menus: [{ id, subjectName, level, category }] where
// `category` is { id, categoryName } or null. No lessons or vocab.
export function getSubjectNames(language) {
  return request(language, '/subject/getsubjectnames');
}

// One full subject, with nested `lesson` and `vocabs`.
export function getSubject(language, id) {
  return request(language, `/subject/get/${id}`);
}

// `level` is required: a code from GET /levels ("A1"…"C2"); anything else is
// a 400. `categoryId` is optional: pass null/undefined for a subject with no
// category. It must be a category of the same language, or the server 404s.
//
// NOTE: the response is { subjectId, subjectName, level, category } — it uses
// `subjectId`, not `id`. We normalise it so the rest of the app can use `id`.
export async function createSubject(language, { subjectName, level, categoryId = null }) {
  const body = { subjectName, level };
  if (categoryId != null) body.categoryId = categoryId;
  const created = await request(language, '/subject/create', {
    method: 'POST',
    body,
  });
  return {
    id: created.subjectId,
    subjectName: created.subjectName,
    level: created.level,
    category: created.category,
  };
}

// Updates a subject's name, level and/or category. Returns the full subject.
//
// `changes` is { subjectName, level?, categoryId?, removeCategory? }:
// - `subjectName` is required — omitting it would set the name to null.
// - `level` changes the level; leave it out to keep the current one. (A level
//   can be changed but never cleared back to null.)
// - `categoryId: n` moves the subject into category n.
// - `removeCategory: true` takes the subject out of its category.
// - Leave both category fields out to keep the current category.
// ⚠ Sending `categoryId` and `removeCategory: true` together is a 400.
export function updateSubject(language, id, changes) {
  return request(language, `/subject/update/${id}`, {
    method: 'PUT',
    body: changes,
  });
}

// Also deletes the subject's lesson and all of its vocab on the server.
export function deleteSubject(language, id) {
  return request(language, `/subject/delete/${id}`, { method: 'DELETE' });
}
