// Category endpoints — see docs/API_REFERENCE.md §3.
// Categories belong to one language. There is no delete endpoint.
import { request } from './client';

// Every category for the language: [{ id, categoryName }].
export function getCategoryNames(language) {
  return request(language, '/category/getcategorynames');
}

// Returns the new category: { id, categoryName }. It starts with no
// subjects; subjects join it through `categoryId` on subject create/update.
export function createCategory(language, categoryName) {
  return request(language, '/category/create', {
    method: 'POST',
    body: { categoryName },
  });
}

// Renames a category. Returns { id, categoryName }.
// ⚠ The backend has no validation: an empty or missing name is stored as-is,
// so callers must check the name isn't blank before calling this.
export function updateCategory(language, id, categoryName) {
  return request(language, `/category/update/${id}`, {
    method: 'PUT',
    body: { categoryName },
  });
}
