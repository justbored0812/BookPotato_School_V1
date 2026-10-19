import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const { outputText } = ts.transpileModule(fs.readFileSync(new URL('./library-filters.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { filterLibraryBooks, defaultLibraryFilters } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const books = [
  { id: 1, title: 'The Hobbit', author: 'J. R. R. Tolkien', isbn: '9780001', ownerId: 2, schoolIds: [10], genre: 'Fantasy', condition: 'Good', isAvailable: true, createdAt: '2025-10-01' },
  { id: 2, title: 'Dune', author: 'Frank Herbert', isbn: '9780002', ownerId: 3, schoolIds: [10, 20], genre: 'Science Fiction', condition: 'Like New', isAvailable: false, createdAt: '2025-10-02' },
  { id: 3, title: 'My Book', author: 'Me', ownerId: 1, schoolIds: [10], genre: 'Fantasy', condition: 'Good', isAvailable: true },
  { id: 4, title: 'Other School Book', author: 'Other', ownerId: 4, schoolIds: [30], genre: 'Fantasy', condition: 'Good', isAvailable: true },
];
const filter = (changes = {}, schools = [10]) => filterLibraryBooks(books, 1, schools, { ...defaultLibraryFilters, ...changes }).map(book => book.id);
test('default shows available classmates books, excluding own and other schools', () => assert.deepEqual(filter(), [1]));
test('no user or school returns no books', () => {
  assert.deepEqual(filter({}, []), []);
  assert.deepEqual(filterLibraryBooks(books, undefined, [10], defaultLibraryFilters), []);
});
test('search matches title, author and ISBN case-insensitively', () => {
  for (const search of ['HOBBIT', 'tolkien', '9780001', 'hobbit tolkien']) assert.deepEqual(filter({ search }), [1]);
  assert.deepEqual(filter({ search: 'missing' }), []);
});
test('filters combine genre, condition and availability', () => {
  assert.deepEqual(filter({ genre: 'Fantasy', condition: 'Good' }), [1]);
  assert.deepEqual(filter({ genre: 'Fantasy', condition: 'Like New' }), []);
  assert.deepEqual(filter({ availability: 'borrowed' }), [2]);
  assert.deepEqual(filter({ availability: 'all' }), [2, 1]);
});
test('school filter supports books shared in more than one joined school', () => {
  assert.deepEqual(filter({ school: '20', availability: 'all' }, [10, 20]), [2]);
  assert.deepEqual(filter({ school: '30', availability: 'all' }), []);
});
test('sort orders work without modifying the original list', () => {
  assert.deepEqual(filter({ availability: 'all', sort: 'title' }), [2, 1]);
  assert.deepEqual(filter({ availability: 'all', sort: 'author' }), [2, 1]);
  assert.deepEqual(filter({ availability: 'all', sort: 'oldest' }), [1, 2]);
  assert.deepEqual(books.map(book => book.id), [1, 2, 3, 4]);
});
test('own books stay excluded when all availability and school filters are cleared', () => assert.deepEqual(filter({ availability: 'all', school: 'all', genre: 'all', condition: 'all' }), [2, 1]));
