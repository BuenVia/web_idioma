// All the app's pages (routes) are listed here.
//
// To add a new page: create it in src/pages/, then add a <Route> below.
// A future "learn" area (flashcards, quizzes…) could live under /learn and
// reuse the same API functions in src/api/.
import { Link, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import SubjectsPage from './pages/SubjectsPage';
import SubjectDetailPage from './pages/SubjectDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import VocabPage from './pages/VocabPage';

function App() {
  return (
    <Routes>
      {/* Every route inside this one is shown within the Layout frame. */}
      <Route element={<Layout />}>
        {/* Categories is the home page. */}
        <Route path="/" element={<CategoriesPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/subjects/:id" element={<SubjectDetailPage />} />
        <Route path="/vocab" element={<VocabPage />} />
        <Route
          path="*"
          element={
            <div className="empty">
              <p>Page not found.</p>
              <Link to="/">Back to categories</Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
