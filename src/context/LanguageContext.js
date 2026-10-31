// Keeps track of which language (es / ca) the user is working in.
//
// Every API call needs the language in its URL, so any component can read it
// with:   const { language } = useLanguage();
//
// The choice is saved in localStorage so it survives a page refresh.
import { createContext, useContext, useState } from 'react';

// To support another language, add it here AND in the backend.
export const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'ca', name: 'Catalan' },
];

const STORAGE_KEY = 'idioma.language';

function loadSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {
    // localStorage can be unavailable (e.g. private mode) — fall through.
  }
  return LANGUAGES[0].code;
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(loadSavedLanguage);

  function setLanguage(code) {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Not critical if saving fails.
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
