// Categories for the current language: create new ones, rename them, and see
// which subjects are in each. Subjects are moved between categories from the
// subject's own page ("Edit").
//
// NOTE: the backend has no "delete category" endpoint, so there is no Delete
// button here.
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import {
  createCategory,
  getCategoryNames,
  updateCategory,
} from '../api/categories';
import { getSubjectNames } from '../api/subjects';
import ErrorMessage from '../components/ErrorMessage';
import CategoryNameDialog from '../components/CategoryNameDialog';
import LevelBadge from '../components/LevelBadge';

export default function CategoriesPage() {
  const { language } = useLanguage();

  const [categories, setCategories] = useState([]);
  // Lightweight subject list ({ id, subjectName, level, category }), used to show
  // which subjects belong to each category.
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [renaming, setRenaming] = useState(null); // the category being renamed

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    // Load both lists at the same time.
    Promise.all([getCategoryNames(language), getSubjectNames(language)])
      .then(([categoryData, subjectData]) => {
        if (ignore) return;
        setCategories(categoryData);
        setSubjects(subjectData);
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

  async function handleCreate(name) {
    const created = await createCategory(language, name);
    setCategories([...categories, created]);
  }

  async function handleRename(name) {
    const updated = await updateCategory(language, renaming.id, name);
    setCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
  }

  function subjectsIn(categoryId) {
    return subjects.filter((s) => s.category && s.category.id === categoryId);
  }

  const uncategorised = subjects.filter((s) => !s.category);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="muted">
            Group subjects together. To move a subject, open it and click Edit.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New category
        </button>
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <p className="muted">Loading…</p>
      ) : !error && categories.length === 0 ? (
        <div className="empty">
          <p>No categories yet.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Create your first category
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.categoryName || 'Untitled'}
              subjects={subjectsIn(category.id)}
              onRename={() => setRenaming(category)}
            />
          ))}
          {uncategorised.length > 0 && (
            <CategoryCard title="No category" subjects={uncategorised} />
          )}
        </div>
      )}

      {showCreate && (
        <CategoryNameDialog
          title="New category"
          submitLabel="Create"
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {renaming && (
        <CategoryNameDialog
          title="Rename category"
          initialName={renaming.categoryName || ''}
          submitLabel="Save"
          onSubmit={handleRename}
          onClose={() => setRenaming(null)}
        />
      )}
    </>
  );
}

// One category: its name, a Rename button (if `onRename` is given) and links
// to its subjects.
function CategoryCard({ title, subjects, onRename }) {
  return (
    <section className="card category-card">
      <div className="section-header">
        <h3>{title}</h3>
        {onRename && (
          <button
            className="btn btn-small btn-ghost"
            onClick={onRename}
            aria-label={`Rename ${title}`}
          >
            Rename
          </button>
        )}
      </div>
      {subjects.length === 0 ? (
        <p className="muted small">No subjects yet.</p>
      ) : (
        <ul className="category-subjects">
          {subjects.map((s) => (
            <li key={s.id}>
              {/* The whole box is the link, so it can be clicked anywhere. */}
              <Link to={`/subjects/${s.id}`} className="subject-chip">
                <span className="subject-chip-name">{s.subjectName || 'Untitled'}</span>
                <LevelBadge level={s.level} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
