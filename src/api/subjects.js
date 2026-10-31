// Subject endpoints — see docs/API_ENDPOINTS.md §3.
import { request } from './client';

// Full subjects, each with its nested `lesson` (or null) and `vocabs` array.
export function getAllSubjects(language) {
  return request(language, '/subject/getall');
}

// One full subject, with nested `lesson` and `vocabs`.
export function getSubject(language, id) {
  return request(language, `/subject/get/${id}`);
}

// NOTE: the response is { subjectId, subjectName } — it uses `subjectId`,
// not `id`. We normalise it here so the rest of the app can always use `id`.
export async function createSubject(language, subjectName) {
  const created = await request(language, '/subject/create', {
    method: 'POST',
    body: { subjectName },
  });
  return { id: created.subjectId, subjectName: created.subjectName };
}

// Only the name can change; a subject's language is fixed.
export function updateSubject(language, id, subjectName) {
  return request(language, `/subject/update/${id}`, {
    method: 'PUT',
    body: { subjectName },
  });
}

// Also deletes the subject's lesson and all of its vocab on the server.
export function deleteSubject(language, id) {
  return request(language, `/subject/delete/${id}`, { method: 'DELETE' });
}
