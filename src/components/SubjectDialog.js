// Pop-up used both to create and to edit a subject: a name field, a CEFR
// level dropdown (from GET /levels) and a category dropdown (from the
// backend, for the current language).
import { useEffect, useState } from 'react';
import Modal from './Modal';
import ErrorMessage from './ErrorMessage';
import { useLanguage } from '../context/LanguageContext';
import { useLevels } from '../context/LevelsContext';
import { getCategoryNames } from '../api/categories';

/**
 * @param {string}      title               - e.g. "New subject"
 * @param {string}      [initialName]       - pre-filled value when editing
 * @param {number|null} [initialCategoryId] - pre-selected category when editing
 * @param {string|null} [initialLevel]      - pre-selected level code when editing
 * @param {boolean}     [levelOptional]     - true when editing an older subject that
 *                                            has no level: it may stay "Not set".
 *                                            New subjects must have a level.
 * @param {string}      submitLabel         - e.g. "Create"
 * @param {Function}    onSubmit            - async ({ name, level, categoryId }) => void;
 *                                            level is a code like "B2", or null if
 *                                            not chosen (only possible when editing
 *                                            an older subject that has no level);
 *                                            categoryId is a number, or null for none
 * @param {Function}    onClose
 */
export default function SubjectDialog({
  title,
  initialName = '',
  initialCategoryId = null,
  initialLevel = null,
  levelOptional = false,
  submitLabel,
  onSubmit,
  onClose,
}) {
  const { language } = useLanguage();
  const { levels, error: levelsError } = useLevels();
  const [name, setName] = useState(initialName);
  // '' means "no level chosen yet".
  const [level, setLevel] = useState(initialLevel || '');
  // <select> values are strings; '' means "no category".
  const [categoryId, setCategoryId] = useState(
    initialCategoryId == null ? '' : String(initialCategoryId)
  );
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Load the categories for the current language when the dialog opens.
  useEffect(() => {
    let ignore = false;
    getCategoryNames(language)
      .then((data) => {
        if (!ignore) setCategories(data);
      })
      .catch((err) => {
        if (!ignore) setError(`Could not load categories. ${err.message}`);
      })
      .finally(() => {
        if (!ignore) setLoadingCategories(false);
      });
    return () => {
      ignore = true;
    };
  }, [language]);

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser reloading the page
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        level: level === '' ? null : level,
        categoryId: categoryId === '' ? null : Number(categoryId),
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>Subject name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Food and drink"
          />
        </label>
        <label className="field">
          <span>Level</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            disabled={levels.length === 0}
          >
            {/* A new subject must have a level, so this placeholder can't be
                picked. An older subject without one may keep "Not set". */}
            <option value="" disabled={!levelOptional}>
              {levels.length === 0 && !levelsError
                ? 'Loading levels…'
                : levelOptional
                  ? 'Not set'
                  : 'Choose a level…'}
            </option>
            {levels.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code} – {l.name}
              </option>
            ))}
          </select>
        </label>
        <ErrorMessage message={levelsError} />
        <label className="field">
          <span>Category</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={loadingCategories}
          >
            <option value="">
              {loadingCategories ? 'Loading categories…' : 'No category'}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.categoryName || 'Untitled'}
              </option>
            ))}
          </select>
        </label>
        <ErrorMessage message={error} />
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          {/* The backend has no validation, so we block empty names here.
              It does reject a new subject without a level (400). */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !name.trim() || (!level && !levelOptional)}
          >
            {busy ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
