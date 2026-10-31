// Pop-up with one text field, used both to create and to rename a subject.
import { useState } from 'react';
import Modal from './Modal';
import ErrorMessage from './ErrorMessage';

/**
 * @param {string}   title         - e.g. "New subject"
 * @param {string}   [initialName] - pre-filled value when renaming
 * @param {string}   submitLabel   - e.g. "Create"
 * @param {Function} onSubmit      - async (name) => void
 * @param {Function} onClose
 */
export default function SubjectNameDialog({
  title,
  initialName = '',
  submitLabel,
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser reloading the page
    setBusy(true);
    setError(null);
    try {
      await onSubmit(name.trim());
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
        <ErrorMessage message={error} />
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          {/* The backend has no validation, so we block empty names here. */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !name.trim()}
          >
            {busy ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
