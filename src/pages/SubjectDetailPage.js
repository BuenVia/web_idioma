// One subject: rename/delete it, and manage its lesson and vocabulary.
//
// We load the whole subject once (it includes `lesson` and `vocabs`) and keep
// it in state. The child sections call `onChange` after they save something,
// and we update our copy — no need to re-fetch.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import { deleteSubject, getSubject, updateSubject } from '../api/subjects';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmDialog from '../components/ConfirmDialog';
import SubjectNameDialog from '../components/SubjectNameDialog';
import LessonSection from '../components/LessonSection';
import VocabSection from '../components/VocabSection';

export default function SubjectDetailPage() {
  const { id } = useParams(); // from the URL: /subjects/:id
  const subjectId = Number(id);
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRename, setShowRename] = useState(false);
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

  async function handleRename(name) {
    const updated = await updateSubject(language, subjectId, name);
    setSubject(updated);
  }

  async function handleDelete() {
    // The server also deletes the lesson and all vocab for this subject.
    await deleteSubject(language, subjectId);
    navigate('/');
  }

  if (loading) return <p className="muted">Loading…</p>;

  if (error) {
    return (
      <>
        <Link to="/" className="back-link">
          ← All subjects
        </Link>
        <ErrorMessage message={error} />
      </>
    );
  }

  return (
    <>
      <Link to="/" className="back-link">
        ← All subjects
      </Link>

      <div className="page-header">
        <h1>{subject.subjectName || 'Untitled'}</h1>
        <div className="actions">
          <button className="btn" onClick={() => setShowRename(true)}>
            Rename
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

      {showRename && (
        <SubjectNameDialog
          title="Rename subject"
          initialName={subject.subjectName || ''}
          submitLabel="Save"
          onSubmit={handleRename}
          onClose={() => setShowRename(false)}
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
