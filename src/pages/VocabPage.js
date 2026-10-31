// Every word in the current language, across all subjects. Each word shows
// its category, subject and CEFR level. Words can be searched and filtered
// by level.
//
// Data comes from vocab/getallgrouped, which nests words inside subjects
// inside categories. We flatten that into one row per word so it can be
// sorted and filtered as a single list.
//
// This page is read-only: words are added and edited from their subject's
// page (the subject name on each row links there).
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import { useLevels } from '../context/LevelsContext';
import { getAllVocabGrouped } from '../api/vocab';
import ErrorMessage from '../components/ErrorMessage';
import LevelBadge from '../components/LevelBadge';

// Value of the level filter meaning "subjects with no level" (older subjects).
// Real level codes are always A1…C2, so this can't clash with one.
const NO_LEVEL = 'none';

// [{ categoryName, subjects: [{ subjectId, subjectName, level, vocabs }] }]
//   → [{ id, term, translation, subjectId, subjectName, level, categoryName }]
function flattenGroups(groups) {
  return groups.flatMap((group) =>
    group.subjects.flatMap((subject) =>
      subject.vocabs.map((vocab) => ({
        ...vocab,
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        level: subject.level,
        // null for the "uncategorised" group.
        categoryName: group.categoryName,
      }))
    )
  );
}

export default function VocabPage() {
  const { language, languageName } = useLanguage();
  const { levels } = useLevels();

  const [vocabs, setVocabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState(''); // '' = all levels

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    getAllVocabGrouped(language)
      .then((groups) => {
        if (!ignore) setVocabs(flattenGroups(groups));
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

  // Only offer "No level" in the filter if some words actually have none.
  const hasWordsWithoutLevel = vocabs.some((v) => !v.level);

  // Search the word, its translation, and its subject and category names.
  // Then sort alphabetically; localeCompare sorts accented letters correctly.
  const query = search.toLowerCase();
  const visibleVocabs = vocabs
    .filter((v) => {
      if (levelFilter === NO_LEVEL) return !v.level;
      if (levelFilter) return v.level === levelFilter;
      return true;
    })
    .filter((v) =>
      [v.term, v.translation, v.subjectName, v.categoryName].some((text) =>
        (text || '').toLowerCase().includes(query)
      )
    )
    .sort((a, b) => (a.term || '').localeCompare(b.term || '', language));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Vocabulary</h1>
          <p className="muted">
            Every {languageName} word across all subjects. To add or edit a
            word, open its subject.
          </p>
        </div>
        {!loading && (
          <span className="muted small">
            {vocabs.length} {vocabs.length === 1 ? 'word' : 'words'}
          </span>
        )}
      </div>

      <ErrorMessage message={error} />

      {vocabs.length > 0 && (
        <div className="filters">
          <input
            className="search"
            type="search"
            placeholder="Search words, translations or subjects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            aria-label="Level"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="">All levels</option>
            {levels.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code} – {l.name}
              </option>
            ))}
            {hasWordsWithoutLevel && <option value={NO_LEVEL}>No level</option>}
          </select>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : !error && vocabs.length === 0 ? (
        <div className="empty">
          <p>No words yet. Add some from a subject's page.</p>
        </div>
      ) : (
        <section className="card section">
          {visibleVocabs.length === 0 ? (
            <p className="muted empty-inline">No words match your filters.</p>
          ) : (
            <ul className="vocab-list">
              {visibleVocabs.map((vocab) => (
                <li key={vocab.id} className="vocab-row vocab-row-readonly">
                  <span className="term">{vocab.term}</span>
                  <span className="translation">{vocab.translation}</span>
                  <div className="vocab-meta">
                    <LevelBadge level={vocab.level} />
                    <span className="pill">{vocab.categoryName || 'No category'}</span>
                    <Link to={`/subjects/${vocab.subjectId}`} className="small">
                      {vocab.subjectName || 'Untitled'}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
