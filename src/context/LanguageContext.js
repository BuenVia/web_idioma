// Keeps track of which languages exist and which one the user is working in.
//
// The list of languages comes from the backend (GET /languages), so a language
// added there shows up here with no front-end change. Any component can read:
//
//   const { language, languageName, languages } = useLanguage();
//
// `language` is null until the list has loaded (`status === 'ready'`).
// Layout waits for that before showing any page, so pages can always use it.
//
// The choice is saved in localStorage so it survives a page refresh.
import { createContext, useContext, useEffect, useState } from 'react';
import { getLanguages } from '../api/languages';

const STORAGE_KEY = 'idioma.language';

// The saved language if the backend still supports it, otherwise the first one.
function pickInitialLanguage(languages) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (languages.some((l) => l.code === saved)) return saved;
  } catch {
    // localStorage can be unavailable (e.g. private mode) — fall through.
  }
  return languages.length > 0 ? languages[0].code : null;
}

// Exported so tests can supply a value directly without a fake backend.
export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [languages, setLanguages] = useState([]);
  const [language, setLanguageState] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  // Changing this number re-runs the effect below, i.e. "try again".
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    setError(null);

    getLanguages()
      .then((list) => {
        if (ignore) return;
        if (list.length === 0) {
          setError('The server did not return any languages.');
          setStatus('error');
          return;
        }
        setLanguages(list);
        setLanguageState(pickInitialLanguage(list));
        setStatus('ready');
      })
      .catch((err) => {
        if (ignore) return;
        setError(`Could not load languages. ${err.message}`);
        setStatus('error');
      });

    return () => {
      ignore = true;
    };
  }, [attempt]);

  function setLanguage(code) {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Not critical if saving fails.
    }
  }

  const current = languages.find((l) => l.code === language);

  const value = {
    languages,
    language,
    languageName: current ? current.name : '',
    setLanguage,
    status,
    error,
    retry: () => setAttempt((n) => n + 1),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
