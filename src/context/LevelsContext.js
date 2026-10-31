// The CEFR levels (A1 … C2) from the backend (GET /levels), loaded once when
// the app starts. They're the same for every language and never change while
// the app is open, so there's no need to fetch them on every page.
//
//   const { levels, levelName, error } = useLevels();
//
// `levels` is [] while loading or if loading failed. Pages that only *show* a
// level still work then (they fall back to the bare code, e.g. "B2"); the
// subject dialog needs the list to offer a choice, so it shows `error`.
import { createContext, useContext, useEffect, useState } from 'react';
import { getLevels } from '../api/levels';

const LevelsContext = createContext({ levels: [], levelName: (code) => code, error: null });

export function LevelsProvider({ children }) {
  const [levels, setLevels] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    getLevels()
      .then((list) => {
        if (!ignore) setLevels(list);
      })
      .catch((err) => {
        if (!ignore) setError(`Could not load levels. ${err.message}`);
      });
    return () => {
      ignore = true;
    };
  }, []);

  // "B2" → "Upper Intermediate". Falls back to the code if it isn't known.
  function levelName(code) {
    const level = levels.find((l) => l.code === code);
    return level ? level.name : code;
  }

  return (
    <LevelsContext.Provider value={{ levels, levelName, error }}>
      {children}
    </LevelsContext.Provider>
  );
}

export function useLevels() {
  return useContext(LevelsContext);
}
