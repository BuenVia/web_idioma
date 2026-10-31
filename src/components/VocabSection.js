// The vocabulary list for a subject: an "add word" form at the top, then a
// table of words. Each row can be edited in place or deleted.
import { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { createVocab, deleteVocab, updateVocab } from '../api/vocab';
import ErrorMessage from './ErrorMessage';
import ConfirmDialog from './ConfirmDialog';

/**
 * @param {number}   subjectId
 * @param {object[]} vocabs   - [{ id, term, translation }]
 * @param {Function} onChange - called with the new vocab array after any save
 */
export default function VocabSection({ subjectId, vocabs, onChange }) {
  const { language, languageName } = useLanguage();

  // "Add word" form
  const [term, setTerm] = useState('');
  const [translation, setTranslation] = useState('');
  const [adding, setAdding] = useState(false);
  const termInput = useRef(null);

  // Editing an existing row: which row, and its draft values
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ term: '', translation: '' });

  const [toDelete, setToDelete] = useState(null);
  const [error, setError] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const created = await createVocab(language, {
        term: term.trim(),
        translation: translation.trim(),
        subjectId,
      });
      onChange([...vocabs, created]);
      setTerm('');
      setTranslation('');
      // Put the cursor back in the first box so many words can be typed fast.
      termInput.current.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  function startEditing(vocab) {
    setEditingId(vocab.id);
    setDraft({ term: vocab.term, translation: vocab.translation });
    setError(null);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setError(null);
    try {
      const updated = await updateVocab(language, editingId, {
        term: draft.term.trim(),
        translation: draft.translation.trim(),
        subjectId, // required by the backend, even when not moving the word
      });
      onChange(vocabs.map((v) => (v.id === editingId ? updated : v)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    await deleteVocab(language, toDelete.id);
    onChange(vocabs.filter((v) => v.id !== toDelete.id));
  }

  const canAdd = term.trim() && translation.trim() && !adding;

  return (
    <section className="card section">
      <div className="section-header">
        <h2>Vocabulary</h2>
        <span className="muted small">
          {vocabs.length} {vocabs.length === 1 ? 'word' : 'words'}
        </span>
      </div>

      <form className="vocab-add" onSubmit={handleAdd}>
        <input
          ref={termInput}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={`${languageName} word`}
          aria-label={`${languageName} word`}
        />
        <input
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="English translation"
          aria-label="English translation"
        />
        <button type="submit" className="btn btn-primary" disabled={!canAdd}>
          Add
        </button>
      </form>

      <ErrorMessage message={error} />

      {vocabs.length === 0 ? (
        <p className="muted empty-inline">No words yet. Add the first one above.</p>
      ) : (
        <ul className="vocab-list">
          {vocabs.map((vocab) =>
            vocab.id === editingId ? (
              // Edit mode for this row. Enter saves, Escape cancels.
              <li key={vocab.id}>
                <form
                  className="vocab-row editing"
                  onSubmit={handleSaveEdit}
                  onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                >
                  <input
                    autoFocus
                    value={draft.term}
                    onChange={(e) => setDraft({ ...draft, term: e.target.value })}
                    aria-label={`${languageName} word`}
                  />
                  <input
                    value={draft.translation}
                    onChange={(e) => setDraft({ ...draft, translation: e.target.value })}
                    aria-label="English translation"
                  />
                  <div className="row-actions">
                    <button type="submit" className="btn btn-small btn-primary">
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={vocab.id} className="vocab-row">
                <span className="term">{vocab.term}</span>
                <span className="translation">{vocab.translation}</span>
                <div className="row-actions">
                  <button className="btn btn-small btn-ghost" onClick={() => startEditing(vocab)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-small btn-danger-ghost"
                    onClick={() => setToDelete(vocab)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete word?"
          message={`"${toDelete.term}" will be removed from this subject.`}
          onConfirm={handleDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </section>
  );
}
