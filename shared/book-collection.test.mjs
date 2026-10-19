import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('./book-collection.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { buildCollectionInfo } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('collection instructions contain the correct book, lender, grade and division', () => {
  const info = buildCollectionInfo('Wonder', { name: 'Aarav', grade: '9', division: 'B', phone: '1234567890' });
  assert.equal(info.message, 'Collect "Wonder" from Aarav in Grade 9, Division B. Please coordinate a time to collect it.');
  assert.equal(info.ownerName, 'Aarav');
  assert.equal(info.ownerGrade, '9');
  assert.equal(info.ownerDivision, 'B');
});
test('details survive notification JSON serialization with exactly the same message', () => {
  const info = buildCollectionInfo('The "Book"', { name: 'Student', grade: '10', division: 'A' });
  const notification = { message: info.message, data: JSON.stringify({ rentalId: 42, ...info }) };
  assert.equal(JSON.parse(notification.data).message, notification.message);
  assert.equal(JSON.parse(notification.data).ownerDivision, 'A');
});
test('missing grade and division ask for confirmation without inventing details', () => {
  const info = buildCollectionInfo('Wonder', { name: 'Aarav', grade: '', division: 'Not provided' });
  assert.equal(info.ownerGrade, 'Not provided');
  assert.equal(info.ownerDivision, 'Not provided');
  assert.match(info.message, /Contact them to confirm their classroom/);
  assert.doesNotMatch(info.message, /undefined|null|Grade Not provided|Division Not provided/);
});
test('a known grade is retained when division is missing', () => {
  const info = buildCollectionInfo('Wonder', { name: 'Aarav', grade: '9' });
  assert.match(info.message, /from Aarav in Grade 9/);
  assert.equal(info.ownerDivision, 'Not provided');
});
test('placeholder phone numbers are not displayed', () => {
  const info = buildCollectionInfo('Wonder', { name: ' Student ', grade: ' 9 ', division: ' B ', phone: '0000000000' });
  assert.equal(info.phone, null);
  assert.equal(info.ownerName, 'Student');
  assert.match(info.message, /Grade 9, Division B/);
});
