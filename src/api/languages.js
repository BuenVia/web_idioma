// GET /languages — see docs/API_REFERENCE.md §1.
// The languages the backend supports: [{ code: "es", name: "Castilian Spanish" }, …].
// `code` is the URL segment (always lowercase). This is the only source of
// truth for which languages exist — nothing in the app hard-codes them.
import { send } from './client';

export function getLanguages() {
  return send('/languages');
}
