import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile = file => ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const collectionModule = 'data:text/javascript;base64,' + Buffer.from(compile('./book-collection.ts')).toString('base64');
const module = compile('./collection-notifications.ts').replace('"./book-collection"', JSON.stringify(collectionModule));
const { schoolCollectionNotification } = await import('data:text/javascript;base64,' + Buffer.from(module).toString('base64'));
const old = { id: 1, title: 'Book Borrowed Successfully', message: 'You have borrowed "Harry Potter" from Test User. Collect from: A-101, Test Tower, Test Street. Contact: 1234567890', data: null, isRead: false, createdAt: '2026-10-19T12:00:00Z' };
const loan = { id: 10, bookId: 20, bookTitle: 'Harry Potter', createdAt: '2026-10-19T11:59:58Z', lender: { name: 'Test User', grade: '9', division: 'a' } };
test('an existing address-based notification becomes school collection instructions', () => {
  const result = schoolCollectionNotification(old, [loan]);
  assert.match(result.message, /Test User in Grade 9, Division a/);
  assert.doesNotMatch(result.message, /A-101|Tower|Street|Collect from:/);
  assert.equal(JSON.parse(result.data).ownerGrade, '9');
  assert.equal(JSON.parse(result.data).ownerDivision, 'a');
  assert.equal(result.isRead, false);
});
test('display projection does not rewrite the original record', () => {
  schoolCollectionNotification(old, [loan]);
  assert.match(old.message, /A-101/);
  assert.equal(old.data, null);
});
test('unmatched old notifications remove the address without inventing classroom details', () => {
  const result = schoolCollectionNotification(old, []);
  assert.doesNotMatch(result.message, /A-101|Tower|Street|undefined/);
  assert.equal(JSON.parse(result.data).ownerName, 'Test User');
  assert.equal(JSON.parse(result.data).ownerGrade, 'Not provided');
});
test('a future borrowing of the same title cannot supply collection details', () => {
  const result = schoolCollectionNotification(old, [{ ...loan, createdAt: '2026-10-20T12:00:00Z' }]);
  assert.equal(JSON.parse(result.data).ownerGrade, 'Not provided');
});
test('other notification types and new collection messages remain unchanged', () => {
  const notification = { ...old, title: 'Book Ready for Collection', message: 'Collect from Test User in Grade 9, Division a.' };
  assert.equal(schoolCollectionNotification(notification, [loan]), notification);
});
