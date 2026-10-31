// The page frame: top bar (logo, navigation, language switcher) + content.
// Every page is rendered inside <Outlet /> by React Router.
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import ErrorMessage from './ErrorMessage';

export default function Layout() {
  const { languages, language, setLanguage, status, error, retry } = useLanguage();
  const navigate = useNavigate();

  function handleLanguageChange(code) {
    setLanguage(code);
    // Subjects belong to one language, so an open subject page would 404
    // after switching. Go back to the home page (Categories) instead.
    navigate('/');
  }

  // Every page needs a language for its API calls, and the list of languages
  // comes from the backend, so pages only render once it has loaded.
  let content;
  if (status === 'loading') {
    content = <p className="muted">Loading…</p>;
  } else if (status === 'error') {
    content = (
      <>
        <ErrorMessage message={error} />
        <button className="btn" onClick={retry}>
          Try again
        </button>
      </>
    );
  } else {
    content = <Outlet />;
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            idioma
          </Link>

          {/* Add more links here later, e.g. a "Learn" section. */}
          <nav className="nav">
            <NavLink to="/" end>
              Categories
            </NavLink>
            {/* `end` so this isn't highlighted on a subject's own page. */}
            <NavLink to="/subjects" end>
              Subjects
            </NavLink>
            <NavLink to="/vocab">Vocabulary</NavLink>
          </nav>

          {/* One button per language from GET /languages. */}
          {languages.length > 0 && (
            <div className="segmented" role="group" aria-label="Language">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={l.code === language ? 'active' : ''}
                  aria-pressed={l.code === language}
                  onClick={() => handleLanguageChange(l.code)}
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="content">{content}</main>
    </div>
  );
}
