/* Direct API helpers for E2E setup steps that are not the UI under test (e.g. which worker matching picked). */
const { randomUUID } = require("crypto");
const API = process.env.SN_API || "http://localhost:7001/api/sn";

async function call(method, path, token, body) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (method === "POST") headers["idempotency-key"] = randomUUID();
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(`${method} ${path} -> ${res.status} ${json.code || ""} ${json.message || ""}`);
  return json.payload;
}
const get = (p, t) => call("GET", p, t);
const post = (p, t, b) => call("POST", p, t, b);
const login = async identifier => (await post("/auth/login", null, { identifier, password: "MatKhau@123" })).access_token;

async function waitFor(label, fn, timeoutMs = 30000, every = 500) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const v = await fn();
    if (v) return v;
    await new Promise(r => setTimeout(r, every));
  }
  throw new Error(`timeout: ${label}`);
}

const put = async (p, t, b) => {
  const res = await fetch(`${API}${p}`, { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${t}` }, body: JSON.stringify(b) });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`PUT ${p} -> ${res.status} ${json.code || ""}`);
  return json.payload;
};

/** Fresh verified workers at a location, so every run has eligible candidates (earlier runs book the seeded ones). */
async function freshWorkers(n, lat, lng, skill = "phuc_vu") {
  const ops = await login("ops@flexiwork.local");
  const phones = [];
  for (let i = 0; i < n; i++) {
    const phone = `090${String(Date.now() + i).slice(-7)}`;
    const reg = await post("/auth/worker/register", null, { phone, password: "MatKhau@123", full_name: `Người lao động E2E ${i + 1}`, accept_terms: true });
    await put("/workers/me", reg.access_token, { skill_codes: [skill], home_lat: lat, home_lng: lng, radius_km: 5, dob: "1999-05-20" });
    await post(`/ops/workers/${reg.user.id}/verify`, ops);
    phones.push(phone);
    await new Promise(r => setTimeout(r, 5));
  }
  return phones;
}

module.exports = { get, post, put, login, waitFor, freshWorkers };
