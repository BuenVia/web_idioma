// Lesson endpoints — see docs/API_REFERENCE.md §6.
// A subject can have at most ONE lesson. Creating a second one makes the
// server return 500, so check `subject.lesson` and use update if it exists.
import { request } from './client';

export function createLesson(language, { lessonTitle, body, subjectId }) {
  return request(language, '/lesson/create', {
    method: 'POST',
    body: { lessonTitle, body, subjectId },
  });
}

// subjectId is required (the server returns 500 without it).
export function updateLesson(language, id, { lessonTitle, body, subjectId }) {
  return request(language, `/lesson/update/${id}`, {
    method: 'PUT',
    body: { lessonTitle, body, subjectId },
  });
}

export function deleteLesson(language, id) {
  return request(language, `/lesson/delete/${id}`, { method: 'DELETE' });
}
