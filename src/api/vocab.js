// Vocab endpoints — see docs/API_ENDPOINTS.md §4.
// `term` is the word in the language being learned; `translation` is English.
import { request } from './client';

// subjectId is required, and the subject must be in the same language.
export function createVocab(language, { term, translation, subjectId }) {
  return request(language, '/vocab/create', {
    method: 'POST',
    body: { term, translation, subjectId },
  });
}

// subjectId is required on update too — pass the current one to keep the
// word in its subject, or a different one to move it.
export function updateVocab(language, id, { term, translation, subjectId }) {
  return request(language, `/vocab/update/${id}`, {
    method: 'PUT',
    body: { term, translation, subjectId },
  });
}

export function deleteVocab(language, id) {
  return request(language, `/vocab/delete/${id}`, { method: 'DELETE' });
}
