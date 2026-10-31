// GET /levels — see docs/API_REFERENCE.md §1.
// The CEFR levels a subject can have, in order A1 → C2:
// [{ code: "A1", name: "Beginner" }, …, { code: "C2", name: "Proficient" }].
// `code` is what subject create/update expect in `level` (uppercase only —
// "b2" is a 400). Not language-scoped.
import { send } from './client';

export function getLevels() {
  return send('/levels');
}
