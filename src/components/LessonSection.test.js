import { render, screen, within } from '@testing-library/react';
import LessonSection from './LessonSection';
import { LanguageProvider } from '../context/LanguageContext';

test('renders the lesson body as Markdown, including tables', () => {
  const lesson = {
    id: 1,
    lessonTitle: 'Fruit',
    body: [
      'Some **important** words:',
      '',
      '| Spanish | English |',
      '| ------- | ------- |',
      '| manzana | apple   |',
      '| pera    | pear    |',
    ].join('\n'),
  };

  render(
    <LanguageProvider>
      <LessonSection subjectId={1} lesson={lesson} onChange={() => {}} />
    </LanguageProvider>
  );

  const article = screen.getByRole('article');
  expect(within(article).getByText('important').tagName).toBe('STRONG');

  const table = within(article).getByRole('table');
  expect(within(table).getAllByRole('columnheader').map((th) => th.textContent.trim())).toEqual([
    'Spanish',
    'English',
  ]);
  expect(within(table).getByRole('cell', { name: 'pera' })).toBeInTheDocument();
});
