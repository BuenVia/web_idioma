// Vocab endpoints — see docs/API_REFERENCE.md §5.
// `term` is the word in the language being learned; `translation` is English.
import { request } from './client';

// Every word in the language, across all subjects: [{ id, term, translation }].
// ⚠ No `subjectId` on these items, so you can't tell which subject a word is
// in. Use getAllVocabGrouped() when you need that.
export function getAllVocab(language) {
  return request(language, '/vocab/getall');
}

// Every word in the language, grouped by category and then subject:
// [{ categoryId, categoryName, subjects: [{ subjectId, subjectName, level, vocabs: [...] }] }]
// - Sorted by the server: categories by name, uncategorised group last
//   (categoryId and categoryName both null), subjects by name, words by id.
// - `level` is the subject's CEFR level, or null for older subjects.
// - Only subjects that have words appear, so it's not a full subject list.
export function getAllVocabGrouped(language) {
  return request(language, '/vocab/getallgrouped');
}

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
