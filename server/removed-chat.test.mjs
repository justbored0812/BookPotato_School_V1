import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const { outputText } = ts.transpileModule(fs.readFileSync(new URL('./removed-chat.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { rejectRemovedChat } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
function request(path, method = 'GET') {
  let code = 200, body, passed = false;
  const res = { status(value) { code = value; return this; }, json(value) { body = value; return this; } };
  rejectRemovedChat({ originalUrl: path, method }, res, () => { passed = true; });
  return { code, body, passed };
}
test('old school and direct chat endpoints are disabled for reading and writing', () => {
  for (const path of ['/api/messages', '/api/messages/conversations', '/api/direct-messages/contacts', '/api/direct-messages/3', '/api/societies/19/messages?limit=50', '/api/societies/19/chat-rooms', '/api/societies/19/chat/read-status', '/api/societies/19/chat/unread-count', '/ws']) {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
      const result = request(path, method);
      assert.equal(result.code, 410, `${method} ${path}`);
      assert.equal(result.passed, false);
      assert.equal(result.body.code, 'CHAT_REMOVED');
    }
  }
});
test('book sharing, school membership and notifications remain available', () => {
  for (const path of ['/api/books/browse', '/api/books', '/api/rentals/borrow', '/api/notifications', '/api/societies/19/join', '/api/societies/19/members', '/api/auth/me']) assert.equal(request(path).passed, true, path);
});
