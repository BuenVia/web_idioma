// The lesson for a subject. A subject has at most one lesson, so this shows:
//   - an empty state with a "Write lesson" button when there is none,
//   - the lesson (read mode) when there is one,
//   - a form (edit mode) when creating or editing.
import { useState } from 'react';
import Markdown from 'markdown-to-jsx';
import { useLanguage } from '../context/LanguageContext';
import { createLesson, deleteLesson, updateLesson } from '../api/lessons';
import ErrorMessage from './ErrorMessage';
import ConfirmDialog from './ConfirmDialog';

/**
 * @param {number}      subjectId
 * @param {object|null} lesson   - { id, lessonTitle, body, createdAt } or null
 * @param {Function}    onChange - called with the saved lesson, or null after delete
 */
export default function LessonSection({ subjectId, lesson, onChange }) {
  const { language } = useLanguage();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  function startEditing() {
    // Copy the current values into the form (empty when creating).
    setTitle(lesson?.lessonTitle || '');
    setBody(lesson?.body || '');
    setError(null);
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = { lessonTitle: title.trim(), body, subjectId };
      // Only one lesson per subject: update if it exists, otherwise create.
      const saved = lesson
        ? await updateLesson(language, lesson.id, data)
        : await createLesson(language, data);
      onChange(saved);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    await deleteLesson(language, lesson.id);
    onChange(null);
  }

  return (
    <section className="card section">
      <div className="section-header">
        <h2>Lesson</h2>
        {lesson && !editing && (
          <div className="actions">
            <button className="btn btn-small" onClick={startEditing}>
              Edit
            </button>
            <button
              className="btn btn-small btn-danger-ghost"
              onClick={() => setShowDelete(true)}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave}>
          <label className="field">
            <span>Title</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ordering at a restaurant"
            />
          </label>
          <label className="field">
            <span>Lesson text</span>
            <textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Explain the topic, give examples… Markdown is supported, including tables."
            />
          </label>
          <ErrorMessage message={error} />
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !title.trim()}
            >
              {busy ? 'Saving…' : 'Save lesson'}
            </button>
          </div>
        </form>
      ) : lesson ? (
        <article className="lesson">
          <h3>{lesson.lessonTitle}</h3>
          {lesson.createdAt && (
            <p className="muted small">
              Created {new Date(lesson.createdAt).toLocaleDateString()}
            </p>
          )}
          {/* The body is Markdown (GitHub-style, so tables work too).
              markdown-to-jsx builds React elements rather than injecting
              raw HTML, so it's safe to render whatever the backend sends. */}
          <Markdown className="lesson-body" options={{ wrapper: 'div', forceWrapper: true }}>
            {lesson.body || ''}
          </Markdown>
        </article>
      ) : (
        <div className="empty empty-inline">
          <p className="muted">This subject doesn't have a lesson yet.</p>
          <button className="btn btn-primary" onClick={startEditing}>
            Write lesson
          </button>
        </div>
      )}

      {showDelete && (
        <ConfirmDialog
          title="Delete lesson?"
          message="The lesson will be removed. The subject and its vocabulary are kept."
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </section>
  );
}
