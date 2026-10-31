// One subject: edit (name, level, category)/delete it, and manage its lesson and vocabulary.
//
// We load the whole subject once (it includes `lesson` and `vocabs`) and keep
// it in state. The child sections call `onChange` after they save something,
// and we update our copy — no need to re-fetch.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import { useLevels } from '../context/LevelsContext';
import { deleteSubject, getSubject, updateSubject } from '../api/subjects';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import SubjectDialog from '../components/SubjectDialog';
import LevelBadge from '../components/LevelBadge';
import LessonSection from '../components/LessonSection';
import VocabSection from '../components/VocabSection';

export default function SubjectDetailPage() {
  const { id } = useParams(); // from the URL: /subjects/:id
  const subjectId = Number(id);
  const { language } = useLanguage();
  const { levelName } = useLevels();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    getSubject(language, subjectId)
      .then((data) => {
        if (!ignore) setSubject(data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [language, subjectId]);

  async function handleEdit({ name, level, categoryId }) {
    // Always send the name (the backend sets it to null if left out).
    // Only send `level` if it changed (leaving it out keeps the current one).
    // Only send a category field if the category actually changed:
    // - a new category → `categoryId`
    // - "No category"  → `removeCategory: true`
    // Sending neither keeps the current category.
    const changes = { subjectName: name };
    if (level && level !== subject.level) changes.level = level;
    const currentCategoryId = subject.category ? subject.category.id : null;
    if (categoryId !== currentCategoryId) {
      if (categoryId === null) changes.removeCategory = true;
      else changes.categoryId = categoryId;
    }
    const updated = await updateSubject(language, subjectId, changes);
    setSubject(updated);
  }

  async function handleDelete() {
    // The server also deletes the lesson and all vocab for this subject.
    await deleteSubject(language, subjectId);
    navigate('/subjects');
  }

  if (loading) return <p className="muted">Loading…</p>;

  if (error) {
    return (
      <>
        <Link to="/subjects" className="back-link">
          ← All subjects
        </Link>
        <ErrorMessage message={error} />
      </>
    );
  }

  return (
    <>
      <Link to="/subjects" className="back-link">
        ← All subjects
      </Link>

      <div className="page-header">
        <div>
          <h1>{subject.subjectName || 'Untitled'}</h1>
          <p className="muted subject-info">
            <span>{subject.category ? subject.category.categoryName : 'No category'}</span>
            {subject.level ? (
              <>
                <LevelBadge level={subject.level} />
                <span>{levelName(subject.level)}</span>
              </>
            ) : (
              <span>No level</span>
            )}
          </p>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => setShowEdit(true)}>
            Edit
          </button>
          <button className="btn btn-danger-ghost" onClick={() => setShowDelete(true)}>
            Delete
          </button>
        </div>
      </div>

      <LessonSection
        subjectId={subjectId}
        lesson={subject.lesson}
        onChange={(lesson) => setSubject({ ...subject, lesson })}
      />

      <VocabSection
        subjectId={subjectId}
        vocabs={subject.vocabs}
        onChange={(vocabs) => setSubject({ ...subject, vocabs })}
      />

      {showEdit && (
        <SubjectDialog
          title="Edit subject"
          initialName={subject.subjectName || ''}
          initialCategoryId={subject.category ? subject.category.id : null}
          initialLevel={subject.level}
          levelOptional={!subject.level}
          submitLabel="Save"
          onSubmit={handleEdit}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showDelete && (
        <ConfirmDialog
          title="Delete subject?"
          message={`"${subject.subjectName}" will be deleted along with its lesson and all ${subject.vocabs.length} words. This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}
