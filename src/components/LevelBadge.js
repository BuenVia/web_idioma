// A small pill showing a subject's CEFR level, e.g. "B2". Hover for the full
// name ("Upper Intermediate"). Renders nothing for subjects with no level
// (older subjects created before levels existed).
import { useLevels } from '../context/LevelsContext';

export default function LevelBadge({ level }) {
  const { levelName } = useLevels();
  if (!level) return null;
  return (
    <span className="pill pill-level" title={levelName(level)}>
      {level}
    </span>
  );
}
