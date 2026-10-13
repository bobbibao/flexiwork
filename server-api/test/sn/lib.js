/* Shared helpers for the Shift Network API smoke scripts (PLAN.md P4 verify). Node >= 20 (global fetch). */
const { randomUUID } = require('crypto');

const BASE = process.env.SN_API || 'http://localhost:7001/api/sn';
const PASSWORD = process.env.SN_PASSWORD || 'MatKhau@123';

async function call(method, path, token, body) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  if (method === 'POST') headers['idempotency-key'] = randomUUID();
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const err = new Error(`${method} ${path} -> ${res.status} ${json.code || ''} ${json.message || ''}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json.payload;
}

const get = (path, token) => call('GET', path, token);
const post = (path, token, body) => call('POST', path, token, body);
const put = (path, token, body) => call('PUT', path, token, body);
const login = async (identifier) => (await post('/auth/login', null, { identifier, password: PASSWORD })).access_token;

async function waitFor(label, fn, timeoutMs = 20000, everyMs = 300) {
  const until = Date.now() + timeoutMs;
  let last;
  while (Date.now() < until) {
    last = await fn();
    if (last) return last;
    await new Promise((r) => setTimeout(r, everyMs));
  }
  throw new Error(`timeout waiting for ${label}`);
}

const waitStatus = (id, token, statuses) =>
  waitFor(`shift ${id} in ${statuses}`, async () => {
    const s = await get(`/shifts/${id}`, token);
    return [].concat(statuses).includes(s.status) ? s : null;
  });

function assert(cond, message) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${message}`);
  console.log(`  ✔ ${message}`);
}

const LOCATION_HCMC = { id: '11111111-1111-4111-8111-111111111111', lat: 10.7769, lng: 106.7009 };

async function topUp(token, amount) {
  // Wait on the intent, not the balance: timers of earlier shifts may move the employer balance concurrently.
  const intent = await post('/wallets/me/top-ups', token, { amount_vnd: amount });
  await waitFor('top-up settled', async () => (await get(`/wallets/me/intents/${intent.id}`, token)).status === 'succeeded');
  return (await get('/wallets/me', token)).balance_vnd;
}

async function postShift(token, { startInMin = 20, hours = 4, hourly = 40000, skill = 'phuc_vu', title = 'Phục vụ bàn (smoke)', dispatch } = {}) {
  const start = new Date(Date.now() + startInMin * 60000);
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + hours * 3600000);
  const res = await post('/shifts', token, {
    work_location_id: LOCATION_HCMC.id,
    title,
    skill_code: skill,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    hourly_vnd: hourly,
    ...(dispatch && { dispatch_mode: dispatch }),
  });
  return res.shifts[0];
}

/** Waits for matching to offer the shift, then logs in as the first offered worker. */
async function offeredWorker(shiftId, employerToken) {
  const s = await waitStatus(shiftId, employerToken, 'MATCHED');
  const workerId = s.offered_worker_ids[0];
  const card = await get(`/workers/${workerId}/card`, employerToken);
  return { workerId, token: await login(card.phone_e164), card };
}

module.exports = { BASE, get, post, put, login, waitFor, waitStatus, assert, topUp, postShift, offeredWorker, LOCATION_HCMC };
