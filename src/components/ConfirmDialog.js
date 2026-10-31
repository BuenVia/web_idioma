// "Are you sure?" pop-up used before anything is deleted.
import { useState } from 'react';
import Modal from './Modal';
import ErrorMessage from './ErrorMessage';

/**
 * @param {string}   title
 * @param {string}   message
 * @param {string}   [confirmLabel="Delete"]
 * @param {Function} onConfirm - async function; the dialog shows a spinner
 *                               label while it runs and any error it throws
 * @param {Function} onClose
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{message}</p>
      <ErrorMessage message={error} />
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
