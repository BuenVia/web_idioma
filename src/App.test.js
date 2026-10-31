// End-to-end-style test of the main flow, with the backend replaced by a
// tiny in-memory fake so no server needs to be running.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';

// Fake backend: handles just the routes this test uses.
function createFakeBackend() {
  let nextId = 1;
  const subjects = [];
  const json = (body, status = 200) =>
    Promise.resolve({
      ok: status < 400,
      status,
      text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
    });

  return jest.fn((url, { method = 'GET', body } = {}) => {
    const data = body ? JSON.parse(body) : {};
    const [, , resource, action, id] = url.split('/');
    const find = () => subjects.find((s) => s.id === Number(id || data.subjectId));

    if (resource === 'subject' && action === 'getall') return json(subjects);
    if (resource === 'subject' && action === 'get') return json(find());
    if (resource === 'subject' && action === 'create') {
      const s = { id: nextId++, subjectName: data.subjectName, lesson: null, vocabs: [] };
      subjects.push(s);
      return json({ subjectId: s.id, subjectName: s.subjectName });
    }
    if (resource === 'vocab' && action === 'create') {
      const v = { id: nextId++, term: data.term, translation: data.translation };
      find().vocabs.push(v);
      return json(v);
    }
    if (resource === 'lesson' && action === 'create') {
      const l = { id: nextId++, lessonTitle: data.lessonTitle, body: data.body, createdAt: new Date().toISOString() };
      find().lesson = l;
      return json(l);
    }
    return json({ status: 404 }, 404);
  });
}

test('create a subject, add a word and write a lesson', async () => {
  global.fetch = createFakeBackend();
  const user = userEvent; // user-event v13 API (no .setup())

  render(
    <MemoryRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </MemoryRouter>
  );

  // Create a subject → we land on its page.
  await user.click(await screen.findByText('Create your first subject'));
  await user.type(screen.getByLabelText('Subject name'), 'Food');
  await user.click(screen.getByText('Create'));
  expect(await screen.findByRole('heading', { name: 'Food' })).toBeInTheDocument();

  // Add a word.
  await user.type(screen.getByPlaceholderText('Spanish word'), 'manzana');
  await user.type(screen.getByPlaceholderText('English translation'), 'apple');
  await user.click(screen.getByText('Add'));
  expect(await screen.findByText('manzana')).toBeInTheDocument();
  expect(screen.getByText('1 word')).toBeInTheDocument();

  // Write the lesson.
  await user.click(screen.getByText('Write lesson'));
  await user.type(screen.getByLabelText('Title'), 'Fruit');
  await user.type(screen.getByLabelText('Lesson text'), 'Una manzana roja.');
  await user.click(screen.getByText('Save lesson'));
  const lesson = await screen.findByRole('article');
  expect(within(lesson).getByText('Una manzana roja.')).toBeInTheDocument();

  // The vocab request must include subjectId (the backend requires it).
  const vocabCall = global.fetch.mock.calls.find(([url]) => url === '/es/vocab/create');
  expect(JSON.parse(vocabCall[1].body)).toEqual({ term: 'manzana', translation: 'apple', subjectId: 1 });
});
