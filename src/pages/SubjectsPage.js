// Home page: every subject in the current language, shown as cards.
// Click a card to open the subject; use "New subject" to add one.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import { createSubject, getAllSubjects } from '../api/subjects';
import ErrorMessage from '../components/ErrorMessage';
import SubjectDialog from '../components/SubjectDialog';
import LevelBadge from '../components/LevelBadge';

export default function SubjectsPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Load subjects whenever the language changes.
  useEffect(() => {
    // `ignore` stops a slow, out-of-date response from overwriting a newer
    // one if the user switches language quickly.
    let ignore = false;
    setLoading(true);
    setError(null);

    getAllSubjects(language)
      .then((data) => {
        if (!ignore) setSubjects(data);
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
  }, [language]);

  async function handleCreate({ name, level, categoryId }) {
    const created = await createSubject(language, { subjectName: name, level, categoryId });
    // Go straight to the new subject so the user can add a lesson and vocab.
    navigate(`/subjects/${created.id}`);
  }

  const visibleSubjects = subjects.filter((s) =>
    (s.subjectName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Subjects</h1>
          <p className="muted">
            Each subject has one lesson and a list of vocabulary.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New subject
        </button>
      </div>

      <ErrorMessage message={error} />

      {subjects.length > 0 && (
        <input
          className="search"
          type="search"
          placeholder="Search subjects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : !error && subjects.length === 0 ? (
        <div className="empty">
          <p>No subjects yet.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Create your first subject
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {visibleSubjects.map((subject) => (
            <Link
              key={subject.id}
              to={`/subjects/${subject.id}`}
              className="card subject-card"
            >
              <h3>{subject.subjectName || 'Untitled'}</h3>
              <div className="subject-meta">
                <LevelBadge level={subject.level} />
                {subject.category && (
                  <span className="pill">{subject.category.categoryName}</span>
                )}
                <span className="pill">
                  {subject.vocabs.length}{' '}
                  {subject.vocabs.length === 1 ? 'word' : 'words'}
                </span>
                <span className={subject.lesson ? 'pill pill-ok' : 'pill'}>
                  {subject.lesson ? 'Lesson ready' : 'No lesson'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <SubjectDialog
          title="New subject"
          submitLabel="Create"
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  );
}
