import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('./school-access.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { createSchoolAccess } = await import('data:text/javascript;base64,' + Buffer.from(outputText + '\n//# sourceURL=school-access-test-module.js').toString('base64'));

async function request(path, { userId = 1, schools = [{ id: 10 }], body = {}, bookSchools = [10], ownerActive = true, contactSchools = [10], unavailable = false, ownerId = 2 } = {}) {
  let passed = false;
  let status = 200;
  let response;
  const storage = {
    getSocietiesByUser: async (id, type) => {
      assert.equal(type, 'school');
      if (unavailable) throw Error('database unavailable');
      return id === 1 ? schools : contactSchools.map(id => ({ id }));
    },
    getBook: async id => id === 404 ? undefined : { ownerId },
    getBookHubsByBook: async () => bookSchools.map(societyId => ({ societyId })),
    isMemberOfSociety: async () => ownerActive,
  };
  const req = { originalUrl: path, session: { userId }, body };
  const res = { status(code) { status = code; return this; }, json(value) { response = value; return this; } };
  await createSchoolAccess(storage)(req, res, () => { passed = true; });
  return { passed, status, response };
}

test('school discovery remains available before joining', async () => {
  assert.equal((await request('/api/societies/available', { schools: [] })).passed, true);
  assert.equal((await request('/api/societies/10/join', { schools: [] })).passed, true);
});
test('unauthenticated callers cannot access books', async () => {
  assert.equal((await request('/api/books/browse', { userId: null })).status, 401);
});
test('users without a school cannot access any main feature', async () => {
  for (const path of ['/api/books/browse', '/api/books/all', '/api/books/my', '/api/books/bulk-add', '/api/books/analyze-bookshelf', '/api/rentals/borrow', '/api/wishlist', '/api/direct-messages', '/api/societies/10/messages']) {
    const result = await request(path, { schools: [] });
    assert.equal(result.status, 403, path);
    assert.equal(result.response.code, 'SCHOOL_REQUIRED', path);
    assert.equal(result.passed, false, path);
  }
});
test('joined users can browse and upload', async () => {
  for (const path of ['/api/books/browse', '/api/books/bulk-add', '/api/books']) assert.equal((await request(path)).passed, true);
});
test('school book and chat URLs reject another school', async () => {
  for (const path of ['/api/books/society/20', '/api/societies/20/messages', '/api/societies/20/chat-rooms', '/api/societies/20/members']) assert.equal((await request(path)).status, 403);
  assert.equal((await request('/api/books/society/10')).passed, true);
  assert.equal((await request('/api/books/society/0')).passed, true);
});
test('book IDs cannot bypass school boundaries', async () => {
  assert.equal((await request('/api/books/5/reviews', { bookSchools: [20] })).status, 403);
  assert.equal((await request('/api/rentals/borrow', { body: { bookId: 5 }, bookSchools: [20] })).status, 403);
  assert.equal((await request('/api/books/5/reviews')).passed, true);
});
test('borrowing requires the selected school to share the book', async () => {
  const options = { schools: [{ id: 10 }, { id: 20 }], bookSchools: [20] };
  assert.equal((await request('/api/rentals/borrow', { ...options, body: { bookId: 5, societyId: 10 } })).status, 403);
  assert.equal((await request('/api/rentals/borrow', { ...options, body: { bookId: 5, societyId: 20 } })).passed, true);
});
test('a former member cannot continue sharing books into a school', async () => {
  assert.equal((await request('/api/books/5/reviews', { ownerActive: false })).status, 403);
});
test('users in multiple schools can access either school', async () => {
  assert.equal((await request('/api/books/5/reviews', { schools: [{ id: 10 }, { id: 20 }], bookSchools: [20] })).passed, true);
});
test('direct messages require a current shared school', async () => {
  assert.equal((await request('/api/direct-messages/2', { contactSchools: [20] })).status, 403);
  assert.equal((await request('/api/direct-messages', { body: { receiverId: 2 }, contactSchools: [] })).status, 403);
  assert.equal((await request('/api/direct-messages/2')).passed, true);
});
test('membership lookup errors deny access', async () => {
  assert.equal((await request('/api/books/browse', { unavailable: true })).status, 500);
});
test('missing book returns 404', async () => {
  assert.equal((await request('/api/books/404/reviews')).status, 404);
});
test('the API rejects borrowing your own book even with a forged request', async () => {
  assert.equal((await request('/api/rentals/borrow', { body: { bookId: 5 }, ownerId: 1 })).status, 403);
});
