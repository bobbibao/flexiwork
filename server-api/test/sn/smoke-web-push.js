/*
 * Web Push end to end (PLAN.md P7 / P12.5) without a browser vendor: this script is the push service.
 * It runs a local HTTPS endpoint, registers it as employer1's push subscription with a fresh P-256 key pair,
 * triggers `shift.accepted`, then checks what the API sent: the VAPID JWT (ES256, aud, exp, sub) and the
 * RFC 8291 aes128gcm payload, decrypted with the subscription's private key.
 *
 * The API must trust the mock's self-signed certificate:
 *   openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj /CN=127.0.0.1 -addext subjectAltName=IP:127.0.0.1 \
 *     -keyout push-mock.key -out push-mock.crt
 *   NODE_EXTRA_CA_CERTS=push-mock.crt <start the api/worker>
 *   SN_PUSH_MOCK_CERT=push-mock.crt SN_PUSH_MOCK_KEY=push-mock.key node test/sn/smoke-web-push.js
 */
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const { BASE, get, post, login, waitFor, assert, topUp, postShift, offeredWorker } = require('./lib');

const PORT = Number(process.env.SN_PUSH_MOCK_PORT || 7443);
const b64url = (buf) => Buffer.from(buf).toString('base64url');

function verifyVapid(header, expectedAud) {
  const m = /^vapid t=([^,]+),\s*k=(.+)$/.exec(header || '');
  if (!m) throw new Error(`unexpected Authorization header: ${header}`);
  const [jwt, k] = [m[1], m[2]];
  const [h, p, sig] = jwt.split('.');
  const pub = Buffer.from(k, 'base64url');
  const key = crypto.createPublicKey({
    key: { kty: 'EC', crv: 'P-256', x: b64url(pub.subarray(1, 33)), y: b64url(pub.subarray(33, 65)) },
    format: 'jwk',
  });
  const ok = crypto.verify('sha256', Buffer.from(`${h}.${p}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url'));
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
  return { ok, claims, header: JSON.parse(Buffer.from(h, 'base64url').toString()), aud: claims.aud === expectedAud };
}

function decryptAes128gcm(body, receiver, authSecret) {
  const salt = body.subarray(0, 16);
  const idLen = body.readUInt8(20);
  const senderPub = body.subarray(21, 21 + idLen);
  const ciphertext = body.subarray(21 + idLen);
  const ecdhSecret = receiver.computeSecret(senderPub);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), receiver.getPublicKey(), senderPub]);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', ecdhSecret, authSecret, keyInfo, 32));
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const decipher = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
  const padded = Buffer.concat([decipher.update(ciphertext.subarray(0, ciphertext.length - 16)), decipher.final()]);
  const end = padded.lastIndexOf(2); // last record: content, 0x02 delimiter, zero padding
  return padded.subarray(0, end).toString('utf8');
}

(async () => {
  console.log('Web Push: VAPID + aes128gcm to a local push service');
  const received = [];
  const server = https.createServer(
    { cert: fs.readFileSync(process.env.SN_PUSH_MOCK_CERT), key: fs.readFileSync(process.env.SN_PUSH_MOCK_KEY) },
    (req, res) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        received.push({ url: req.url, headers: req.headers, body: Buffer.concat(chunks) });
        res.writeHead(201).end();
      });
    },
  );
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

  const receiver = crypto.createECDH('prime256v1');
  receiver.generateKeys();
  const authSecret = crypto.randomBytes(16);
  const endpoint = `https://127.0.0.1:${PORT}/push/${crypto.randomUUID()}`;

  const employer = await login('employer1@flexiwork.local');
  const vapidKey = await get('/push/vapid-public-key', employer);
  const sub = await post('/push-subscriptions', employer, {
    platform: 'webpush',
    endpoint,
    keys: { p256dh: b64url(receiver.getPublicKey()), auth: b64url(authSecret) },
    user_agent: 'smoke-web-push',
  });
  assert(!!sub.id, 'push subscription registered');

  try {
    await topUp(employer, 500_000);
    const shift = await postShift(employer, { startInMin: 90, hours: 3, title: 'Phục vụ (web push smoke)' });
    const { token: worker } = await offeredWorker(shift.id, employer);
    await post(`/shifts/${shift.id}/accept`, worker);

    const push = await waitFor('push delivered to the mock push service', async () => received.find((r) => r.url === new URL(endpoint).pathname), 30000);
    assert(push.headers['content-encoding'] === 'aes128gcm', 'Content-Encoding: aes128gcm');
    assert(Number(push.headers.ttl) > 0, `TTL header ${push.headers.ttl}`);

    const vapid = verifyVapid(push.headers.authorization, `https://127.0.0.1:${PORT}`);
    assert(vapid.ok, `VAPID JWT signature valid (${vapid.header.alg})`);
    assert(vapid.aud, `JWT aud = push service origin (${vapid.claims.aud})`);
    assert(vapid.claims.exp * 1000 > Date.now() && vapid.claims.exp * 1000 <= Date.now() + 24 * 3600 * 1000, 'JWT exp within 24 h');
    assert(/^mailto:|^https:/.test(vapid.claims.sub), `JWT sub ${vapid.claims.sub}`);
    const k = /k=(.+)$/.exec(push.headers.authorization)[1];
    assert(k === vapidKey.public_key, 'k = the VAPID public key served to browsers');

    const payload = JSON.parse(decryptAes128gcm(push.body, receiver, authSecret));
    assert(payload.title === 'Đã có người nhận ca', `decrypted title "${payload.title}"`);
    assert(payload.body.includes('Phục vụ (web push smoke)'), `decrypted body "${payload.body}"`);
    assert(payload.url === `/#/sn/employer/shifts/${shift.id}`, `deep link ${payload.url}`);
  } finally {
    await fetch(`${BASE}/push-subscriptions/${sub.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${employer}` } });
    server.close();
  }
  console.log('WEB PUSH OK');
  process.exit(0);
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
