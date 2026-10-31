// The page frame: top bar (logo, navigation, language switcher) + content.
// Every page is rendered inside <Outlet /> by React Router.
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { LANGUAGES, useLanguage } from '../context/LanguageContext';

export default function Layout() {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  function handleLanguageChange(code) {
    setLanguage(code);
    // Subjects belong to one language, so an open subject page would 404
    // after switching. Go back to the list instead.
    navigate('/');
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
              Subjects
            </NavLink>
          </nav>

          <div className="segmented" role="group" aria-label="Language">
            {LANGUAGES.map((l) => (
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
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
