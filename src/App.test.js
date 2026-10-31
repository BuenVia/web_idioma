// End-to-end-style test of the main flow, with the backend replaced by a
// tiny in-memory fake so no server needs to be running.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { LevelsProvider } from './context/LevelsContext';

// Fake backend: handles just the routes this test uses.
function createFakeBackend() {
  let nextId = 1;
  const subjects = [];
  const categories = [{ id: 50, categoryName: 'Everyday life' }];
  const languages = [
    { code: 'es', name: 'Castilian Spanish' },
    { code: 'ca', name: 'Catalan' },
  ];
  const levels = [
    { code: 'A1', name: 'Beginner' },
    { code: 'B2', name: 'Upper Intermediate' },
  ];
  const json = (body, status = 200) =>
    Promise.resolve({
      ok: status < 400,
      status,
      text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
    });

  return jest.fn((url, { method = 'GET', body } = {}) => {
    const data = body ? JSON.parse(body) : {};
    // The two routes that aren't under a language.
    if (url === '/languages') return json(languages);
    if (url === '/levels') return json(levels);

    const [, , resource, action, id] = url.split('/');
    const find = () => subjects.find((s) => s.id === Number(id || data.subjectId));

    if (resource === 'category' && action === 'getcategorynames') return json(categories);
    if (resource === 'category' && action === 'create') {
      const c = { id: nextId++, categoryName: data.categoryName };
      categories.push(c);
      return json(c);
    }
    if (resource === 'category' && action === 'update') {
      const c = categories.find((x) => x.id === Number(id));
      c.categoryName = data.categoryName;
      return json(c);
    }
    if (resource === 'subject' && action === 'getsubjectnames') {
      return json(subjects.map(({ id, subjectName, level, category }) => ({ id, subjectName, level, category })));
    }
    if (resource === 'subject' && action === 'update') {
      // Mirrors the real backend's rules for the category fields.
      if (data.categoryId != null && data.removeCategory) return json({ status: 400 }, 400);
      const s = find();
      s.subjectName = data.subjectName;
      if (data.level) s.level = data.level;
      if (data.removeCategory) s.category = null;
      else if (data.categoryId != null) s.category = categories.find((c) => c.id === data.categoryId);
      return json(s);
    }
    if (resource === 'subject' && action === 'getall') return json(subjects);
    if (resource === 'subject' && action === 'get') return json(find());
    if (resource === 'subject' && action === 'create') {
      const category = categories.find((c) => c.id === data.categoryId) || null;
      if (!data.level) return json({ status: 400 }, 400); // level is required
      const s = { id: nextId++, subjectName: data.subjectName, level: data.level, category, lesson: null, vocabs: [] };
      subjects.push(s);
      return json({ subjectId: s.id, subjectName: s.subjectName, level: s.level, category });
    }
    if (resource === 'vocab' && action === 'getallgrouped') {
      // Like the real backend: grouped by category, uncategorised last, and
      // only subjects that have words. (Sorting is skipped here.)
      const withWords = subjects.filter((s) => s.vocabs.length > 0);
      const group = (category, list) => ({
        categoryId: category ? category.id : null,
        categoryName: category ? category.categoryName : null,
        subjects: list.map((s) => ({ subjectId: s.id, subjectName: s.subjectName, level: s.level, vocabs: s.vocabs })),
      });
      const groups = categories
        .map((c) => group(c, withWords.filter((s) => s.category && s.category.id === c.id)))
        .filter((g) => g.subjects.length > 0);
      const uncategorised = withWords.filter((s) => !s.category);
      if (uncategorised.length > 0) groups.push(group(null, uncategorised));
      return json(groups);
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

function renderApp(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <LevelsProvider>
          <App />
        </LevelsProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

// The request body sent for the most recent call to `url`.
function lastBody(url) {
  const calls = global.fetch.mock.calls.filter(([u]) => u === url);
  return JSON.parse(calls[calls.length - 1][1].body);
}

test('create a subject, add a word and write a lesson', async () => {
  global.fetch = createFakeBackend();
  const user = userEvent; // user-event v13 API (no .setup())

  renderApp('/subjects');

  // Create a subject in a category → we land on its page.
  await user.click(await screen.findByText('Create your first subject'));
  await user.type(screen.getByLabelText('Subject name'), 'Food');
  // Create stays disabled until a level is picked (the backend requires one).
  expect(screen.getByText('Create')).toBeDisabled();
  // Levels come from GET /levels; categories load when the dialog opens.
  user.selectOptions(screen.getByLabelText('Level'), 'B2');
  await screen.findByRole('option', { name: 'Everyday life' });
  user.selectOptions(screen.getByLabelText('Category'), '50');
  await user.click(screen.getByText('Create'));
  expect(await screen.findByRole('heading', { name: 'Food' })).toBeInTheDocument();
  expect(screen.getByText('Everyday life')).toBeInTheDocument();
  expect(screen.getByText('Upper Intermediate')).toBeInTheDocument();
  const createCall = global.fetch.mock.calls.find(([url]) => url === '/es/subject/create');
  expect(JSON.parse(createCall[1].body)).toEqual({ subjectName: 'Food', level: 'B2', categoryId: 50 });

  // Add a word. The placeholder uses the language name from GET /languages.
  await user.type(screen.getByPlaceholderText('Castilian Spanish word'), 'manzana');
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

// Clicks Save and waits for the dialog to close (i.e. the save finished).
async function saveDialog() {
  userEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

test('change and remove a subject\'s category', async () => {
  global.fetch = createFakeBackend();
  renderApp('/subjects');

  // Create a subject with no category.
  userEvent.click(await screen.findByText('Create your first subject'));
  userEvent.type(screen.getByLabelText('Subject name'), 'Food');
  userEvent.selectOptions(await screen.findByLabelText('Level'), 'A1');
  await screen.findByRole('option', { name: 'Everyday life' });
  userEvent.click(screen.getByText('Create'));
  await screen.findByRole('heading', { name: 'Food' });
  expect(screen.getByText('No category')).toBeInTheDocument();

  // Edit → pick a category → sends categoryId.
  userEvent.click(screen.getByText('Edit'));
  await screen.findByRole('option', { name: 'Everyday life' });
  userEvent.selectOptions(screen.getByLabelText('Category'), '50');
  await saveDialog();
  expect(screen.getByText('Everyday life')).toBeInTheDocument();
  expect(lastBody('/es/subject/update/1')).toEqual({ subjectName: 'Food', categoryId: 50 });

  // Edit → rename only → category fields left out (category unchanged).
  userEvent.click(screen.getByText('Edit'));
  await screen.findByRole('option', { name: 'Everyday life' });
  userEvent.type(screen.getByLabelText('Subject name'), ' and drink');
  await saveDialog();
  expect(screen.getByRole('heading', { name: 'Food and drink' })).toBeInTheDocument();
  expect(screen.getByText('Everyday life')).toBeInTheDocument();
  expect(lastBody('/es/subject/update/1')).toEqual({ subjectName: 'Food and drink' });

  // Edit → change level only → sends level, category fields left out.
  userEvent.click(screen.getByText('Edit'));
  await screen.findByRole('option', { name: 'Everyday life' });
  userEvent.selectOptions(screen.getByLabelText('Level'), 'B2');
  await saveDialog();
  expect(screen.getByText('Upper Intermediate')).toBeInTheDocument();
  expect(lastBody('/es/subject/update/1')).toEqual({ subjectName: 'Food and drink', level: 'B2' });

  // Edit → "No category" → sends removeCategory.
  userEvent.click(screen.getByText('Edit'));
  await screen.findByRole('option', { name: 'Everyday life' });
  userEvent.selectOptions(screen.getByLabelText('Category'), '');
  await saveDialog();
  expect(screen.getByText('No category')).toBeInTheDocument();
  expect(lastBody('/es/subject/update/1')).toEqual({ subjectName: 'Food and drink', removeCategory: true });
});

test('create and rename a category', async () => {
  global.fetch = createFakeBackend();
  renderApp(); // Categories is the home page

  const existing = await screen.findByRole('heading', { name: 'Everyday life' });
  expect(existing).toBeInTheDocument();

  // Create.
  userEvent.click(screen.getByText('+ New category'));
  userEvent.type(screen.getByLabelText('Category name'), 'Grammar');
  userEvent.click(screen.getByText('Create'));
  expect(await screen.findByRole('heading', { name: 'Grammar' })).toBeInTheDocument();
  expect(lastBody('/es/category/create')).toEqual({ categoryName: 'Grammar' });

  // Rename the new one.
  userEvent.click(screen.getByRole('button', { name: 'Rename Grammar' }));
  const input = screen.getByLabelText('Category name');
  userEvent.clear(input);
  userEvent.type(input, 'Grammar & usage');
  await saveDialog();
  expect(screen.getByRole('heading', { name: 'Grammar & usage' })).toBeInTheDocument();
  expect(lastBody('/es/category/update/1')).toEqual({ categoryName: 'Grammar & usage' });
});

test('the vocabulary page shows each word with its category, subject and level', async () => {
  global.fetch = createFakeBackend();
  renderApp('/subjects');

  // Two subjects with one word each: one in a category, one not.
  for (const [subject, level, categoryId, term, translation] of [
    ['Food', 'A1', '50', 'manzana', 'apple'],
    ['Animals', 'B2', '', 'gato', 'cat'],
  ]) {
    userEvent.click(await screen.findByText(/New subject|Create your first subject/));
    userEvent.type(screen.getByLabelText('Subject name'), subject);
    userEvent.selectOptions(screen.getByLabelText('Level'), level);
    await screen.findByRole('option', { name: 'Everyday life' });
    userEvent.selectOptions(screen.getByLabelText('Category'), categoryId);
    userEvent.click(screen.getByText('Create'));
    await screen.findByRole('heading', { name: subject });
    userEvent.type(screen.getByPlaceholderText('Castilian Spanish word'), term);
    userEvent.type(screen.getByPlaceholderText('English translation'), translation);
    userEvent.click(screen.getByText('Add'));
    await screen.findByText(term);
    userEvent.click(screen.getByRole('link', { name: 'Subjects' }));
  }

  userEvent.click(screen.getByRole('link', { name: 'Vocabulary' }));
  expect(await screen.findByText('2 words')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith('/es/vocab/getallgrouped', expect.anything());

  // Alphabetical by term (gato before manzana), each with level, category and subject.
  const rows = screen.getAllByRole('listitem');
  expect(rows).toHaveLength(2);
  expect(within(rows[0]).getByText('gato')).toBeInTheDocument();
  expect(within(rows[1]).getByText('manzana')).toBeInTheDocument();
  expect(within(rows[0]).getByText('B2')).toBeInTheDocument();
  expect(within(rows[0]).getByText('No category')).toBeInTheDocument();
  // The subject link goes to that subject's page (id from the create response).
  const animalsId = JSON.parse(global.fetch.mock.calls.filter(([u]) => u === '/es/vocab/create')[1][1].body).subjectId;
  expect(within(rows[0]).getByRole('link', { name: 'Animals' })).toHaveAttribute('href', `/subjects/${animalsId}`);
  expect(within(rows[1]).getByText('A1')).toBeInTheDocument();
  expect(within(rows[1]).getByText('Everyday life')).toBeInTheDocument();
  expect(within(rows[1]).getByRole('link', { name: 'Food' })).toBeInTheDocument();

  // Filter by level (options come from GET /levels).
  userEvent.selectOptions(screen.getByLabelText('Level'), 'A1');
  expect(screen.getByText('manzana')).toBeInTheDocument();
  expect(screen.queryByText('gato')).not.toBeInTheDocument();
  userEvent.selectOptions(screen.getByLabelText('Level'), '');

  // Search matches the translation, and the subject name too.
  userEvent.type(screen.getByPlaceholderText('Search words, translations or subjects…'), 'appl');
  expect(screen.getByText('manzana')).toBeInTheDocument();
  expect(screen.queryByText('gato')).not.toBeInTheDocument();
  userEvent.clear(screen.getByPlaceholderText('Search words, translations or subjects…'));
  userEvent.type(screen.getByPlaceholderText('Search words, translations or subjects…'), 'anim');
  expect(screen.getByText('gato')).toBeInTheDocument();
  expect(screen.queryByText('manzana')).not.toBeInTheDocument();
});

test('the language switcher is built from GET /languages', async () => {
  global.fetch = createFakeBackend();
  renderApp();

  const group = await screen.findByRole('group', { name: 'Language' });
  const buttons = within(group).getAllByRole('button');
  expect(buttons.map((b) => b.textContent)).toEqual(['Castilian Spanish', 'Catalan']);

  // Switching changes the language segment of later requests.
  userEvent.click(within(group).getByText('Catalan'));
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith('/ca/category/getcategorynames', expect.anything())
  );
});

test('shows an error with a retry button if languages cannot be loaded', async () => {
  const backend = createFakeBackend();
  let fail = true;
  global.fetch = jest.fn((url, opts) =>
    url === '/languages' && fail
      ? Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('') })
      : backend(url, opts)
  );
  renderApp();

  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load languages.');
  fail = false;
  userEvent.click(screen.getByText('Try again'));
  expect(await screen.findByRole('heading', { name: 'Everyday life' })).toBeInTheDocument();
});
