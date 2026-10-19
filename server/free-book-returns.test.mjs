import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('./free-book-returns.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { createFreeBookReturns } = await import('data:text/javascript;base64,' + Buffer.from(outputText + '\n//# sourceURL=free-book-returns-test-module.js').toString('base64'));

function fixture(status = 'overdue') {
  const rental = { id: 1, bookId: 5, borrowerId: 10, lenderId: 20, status, endDate: '2020-01-01', book: { title: 'Test Book', dailyFee: '10' }, securityDeposit: '100' };
  const changes = [];
  const notifications = [];
  const storage = {
    getRental: async () => rental,
    getUser: async id => ({ name: `Student ${id}`, phone: '12345' }),
    updateRental: async (id, data) => { changes.push({ kind: 'rental', id, data }); Object.assign(rental, data); },
    updateBook: async (id, data) => changes.push({ kind: 'book', id, data }),
  };
  const handlers = createFreeBookReturns(storage, async data => { notifications.push(data); });
  async function call(handler, userId, body = {}) {
    let code = 200, data;
    const res = { status(value) { code = value; return this; }, json(value) { data = value; return this; } };
    await handlers[handler]({ params: { id: '1' }, session: { userId }, body }, res, () => {});
    return { code, data };
  }
  return { call, changes, notifications, rental };
}
test('overdue return requests are free and cannot accept a submitted late fee', async () => {
  const f = fixture();
  const response = await f.call('requestReturn', 10, { lateFeeAmount: 900, notes: 'After class' });
  assert.equal(response.code, 200);
  assert.equal(response.data.requiresPayment, false);
  assert.deepEqual(f.changes, [{ kind: 'rental', id: 1, data: { status: 'return_requested' } }]);
  assert.equal(f.notifications[0].userId, 20);
  assert.match(f.notifications[0].message, /After class/);
  assert.doesNotMatch(f.notifications[0].message, /fee|payment|deposit|refund|₹/i);
});
test('another user cannot request a return', async () => {
  const f = fixture();
  assert.equal((await f.call('requestReturn', 99)).code, 403);
  assert.equal(f.changes.length, 0);
});
test('returned loans and duplicate requests are rejected', async () => {
  for (const status of ['returned', 'return_requested']) {
    const f = fixture(status);
    assert.equal((await f.call('requestReturn', 10)).code, 400);
    assert.equal(f.changes.length, 0);
  }
});
test('lender confirmation makes the book available and records the return date', async () => {
  const f = fixture('return_requested');
  assert.equal((await f.call('confirmReturn', 20)).code, 200);
  assert.equal(f.rental.status, 'returned');
  assert.ok(f.rental.actualReturnDate instanceof Date);
  assert.deepEqual(f.changes[1], { kind: 'book', id: 5, data: { isAvailable: true } });
  assert.equal(f.notifications[0].userId, 10);
  assert.doesNotMatch(f.notifications[0].message, /fee|payment|deposit|refund|₹/i);
});
test('borrowers cannot confirm their own return', async () => {
  const f = fixture('return_requested');
  assert.equal((await f.call('confirmReturn', 10)).code, 403);
  assert.equal(f.changes.length, 0);
});
test('confirmation requires a pending request and rejects repeat confirmations', async () => {
  const f = fixture('active');
  assert.equal((await f.call('confirmReturn', 20)).code, 400);
  f.rental.status = 'return_requested';
  assert.equal((await f.call('confirmReturn', 20)).code, 200);
  assert.equal((await f.call('confirmReturn', 20)).code, 400);
});
