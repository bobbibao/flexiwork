/*
 * Shift Network UI scenarios S1-S10 (docs/PLAN.md §17.4), driven with Playwright.
 * Prerequisites: API on :7001 with FEATURE_SHIFT_NETWORK=true and SN_TIMER_SPEEDUP=10 (dev), `yarn seed:sn-dev`,
 * frontend on :8080 (yarn dev:vite or preview:vite). Evidence screenshots go to $SN_EVIDENCE (default: OS tmp dir).
 */
const { BASE, EVIDENCE, launch, newPage, shot, check, assertVietnamese, assertNoErrors, result } = require("./lib");
const api = require("./api");

const LOC = { latitude: 10.7769, longitude: 106.7009, accuracy: 15 };
const FAR = { latitude: 10.795, longitude: 106.7009, accuracy: 15 };
const ts = Date.now();

const vnLocal = date => {
  const d = new Date(date.getTime() + 7 * 3600000);
  return d.toISOString().slice(0, 16);
};
const go = async (page, path) => {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
};
const token = page => page.evaluate(() => localStorage.getItem("sn_access_token"));
const statusOf = async page => page.locator("[data-status]").first().getAttribute("data-status");
const waitStatus = async (page, statuses, timeout = 40000) => {
  const want = [].concat(statuses);
  try {
    await page.waitForFunction(w => w.includes(document.querySelector("[data-status]")?.getAttribute("data-status")), want, { timeout });
  } catch (e) {
    const alerts = await page.locator("[data-test=sn-alert]").allInnerTexts().catch(() => []);
    console.log(`  ✘ waiting for ${want} on ${page.url().split("#")[1]}: status=${await statusOf(page)} alerts=${JSON.stringify(alerts)}`);
    throw e;
  }
  return statusOf(page);
};

async function loginUi(page, identifier) {
  await go(page, "/sn/login");
  await page.fill("#sn-identifier", identifier);
  await page.fill("#sn-password", "MatKhau@123");
  await page.click("[data-test=sn-login-submit]");
  await page.waitForURL(/#\/sn\/(?!login)/, { timeout: 20000 });
}

(async () => {
  const browser = await launch();
  const employer = await newPage(browser, "desktop");
  await api.freshWorkers(4, LOC.latitude, LOC.longitude);

  // ---------------------------------------------------------------- S1 employer onboarding
  console.log("S1 employer onboarding (1440)");
  await go(employer, "/sn/login");
  await assertVietnamese(employer, "/sn/login");
  await shot(employer, "s1-login");
  await go(employer, "/sn/register/employer");
  await assertVietnamese(employer, "/sn/register/employer");
  await employer.fill("#e-company", `Quán Cà Phê E2E ${ts}`);
  await employer.fill("#e-contact", "Phạm Thị Lan");
  await employer.fill("#e-email", `e2e-${ts}@flexiwork.local`);
  await employer.fill("#e-phone", `028${String(ts).slice(-8)}`);
  await employer.fill("#e-pass", "MatKhau@123");
  await employer.check("[data-test=e-terms]");
  await employer.click("[data-test=e-submit]");
  await employer.waitForURL(/employer\/locations/, { timeout: 20000 });
  check(true, "registered employer -> locations page");
  await employer.click("[data-test=add-location]");
  await employer.fill("#loc-name", "Quán Cà Phê E2E - Quận 1");
  await employer.fill("#loc-address", "12 Lý Tự Trọng, Phường Sài Gòn, TP. Hồ Chí Minh");
  await employer.fill("#loc-lat", String(LOC.latitude));
  await employer.fill("#loc-lng", String(LOC.longitude));
  await employer.click("[data-test=save-location]");
  await employer.waitForSelector("[data-test=location-item]");
  check((await employer.locator("[data-test=location-item]").count()) === 1, "work location created");
  await assertVietnamese(employer, "/sn/employer/locations");
  await shot(employer, "s1-locations");
  assertNoErrors(employer, "S1");

  // ---------------------------------------------------------------- S2 top-up
  console.log("S2 top-up (fake gateway)");
  await go(employer, "/sn/wallet");
  await employer.click("[data-test=topup-1000000]");
  await employer.waitForFunction(() => document.querySelector("[data-test=wallet-balance]")?.textContent.includes("1.000.000"), null, { timeout: 20000 });
  check(true, "balance 1.000.000 ₫ after fake webhook");
  check((await employer.locator("[data-test=statement-item]").first().innerText()).includes("Nạp tiền"), 'statement shows "Nạp tiền"');
  await assertVietnamese(employer, "/sn/wallet");
  await shot(employer, "s2-wallet");
  assertNoErrors(employer, "S2");

  // ---------------------------------------------------------------- S3 post a shift
  console.log("S3 post a shift");
  await go(employer, "/sn/employer/shifts/new");
  await employer.waitForSelector("#sc-title");
  const start = new Date(Math.ceil((Date.now() + 20 * 60000) / 60000) * 60000);
  await employer.fill("#sc-title", "Phục vụ bàn ca chiều (E2E)");
  await employer.selectOption("#sc-skill", "phuc_vu");
  await employer.fill("#sc-start", vnLocal(start));
  await employer.fill("#sc-end", vnLocal(new Date(start.getTime() + 4 * 3600000)));
  await employer.fill("#sc-rate", "40000");
  await employer.waitForFunction(() => /160\.000/.test(document.querySelector("[data-test=quote-gross]")?.textContent || ""), null, { timeout: 15000 }).catch(() => null);
  const gross = await employer.locator("[data-test=quote-gross]").innerText().catch(() => "");
  check(/₫/.test(gross), `price preview shows gross ${gross}`);
  await assertVietnamese(employer, "/sn/employer/shifts/new");
  await shot(employer, "s3-create");
  await employer.click("[data-test=shift-submit]");
  await employer.waitForURL(/employer\/shifts\/[0-9a-f-]{36}/, { timeout: 20000 });
  const shiftId = employer.url().split("/").pop();
  const st = await waitStatus(employer, ["POSTED", "MATCHED"]);
  check(["POSTED", "MATCHED"].includes(st), `shift ${shiftId.slice(0, 8)} posted (${st})`);
  await assertVietnamese(employer, "/sn/employer/shifts/:id");
  assertNoErrors(employer, "S3");

  // ---------------------------------------------------------------- S4 worker accepts (mobile)
  console.log("S4 worker accepts (390)");
  const employerToken = await token(employer);
  const offered = await api.waitFor("matching offer", async () => (await api.get(`/shifts/${shiftId}`, employerToken)).offered_worker_ids?.[0], 30000);
  const card = await api.get(`/workers/${offered}/card`, employerToken);
  const worker = await newPage(browser, "mobile", FAR);
  await loginUi(worker, card.phone_e164.replace("+84", "0"));
  check(/shift-board/.test(worker.url()), `worker #${offered} logged in by phone -> ${worker.url().split("#")[1]}`);
  await assertVietnamese(worker, "/sn/shift-board (390)");
  await go(worker, "/sn/offers");
  await worker.waitForSelector("[data-test=offer-item]", { timeout: 20000 });
  await assertVietnamese(worker, "/sn/offers (390)");
  await shot(worker, "s4-offers");
  await worker.click("[data-test=accept-offer]");
  await worker.waitForURL(/my-shifts\/[0-9a-f-]{36}/, { timeout: 20000 });
  check((await waitStatus(worker, "ESCROW_FUNDED")) === "ESCROW_FUNDED", 'status "Đã xác nhận" once escrow is held');
  const wallet = await api.get("/wallets/me", employerToken);
  check(wallet.balance_vnd === 1000000 - 176000 && wallet.escrow_held_vnd === 176000, `employer balance ${wallet.balance_vnd}, escrow held ${wallet.escrow_held_vnd}`);
  assertNoErrors(worker, "S4");

  // ---------------------------------------------------------------- S5 check-in / check-out with geolocation
  console.log("S5 check-in / check-out");
  await worker.click("[data-test=btn-check-in]");
  await worker.waitForSelector("[data-test=sn-alert]", { timeout: 20000 });
  const alertText = await worker.locator(".alert-light-danger").innerText().catch(() => "");
  check(alertText.includes("Bạn đang ở ngoài khu vực làm việc"), `2 km away -> "${alertText.trim()}"`);
  await shot(worker, "s5-outside-geofence");
  worker.errors.splice(0);
  await worker.context().setGeolocation(LOC);
  await worker.click("[data-test=btn-check-in]");
  check((await waitStatus(worker, "CHECKED_IN")) === "CHECKED_IN", "check-in at the location succeeds");
  await assertVietnamese(worker, "/sn/my-shifts/:id (390)");
  await worker.click("[data-test=btn-check-out]");
  check((await waitStatus(worker, "CHECKED_OUT")) === "CHECKED_OUT", 'check-out -> "Chờ xác nhận"');
  await shot(worker, "s5-checked-out");
  assertNoErrors(worker, "S5");

  // ---------------------------------------------------------------- S10 live notifications on the employer page
  console.log("S10 notifications (live)");
  await employer.waitForSelector("[data-test=sn-bell-count]", { timeout: 20000 }).catch(() => null);
  const count = await employer.locator("[data-test=sn-bell-count]").innerText().catch(() => "0");
  check(Number(count) >= 1, `employer bell shows ${count} unread without reload (Socket.IO)`);

  // ---------------------------------------------------------------- S6 confirm and pay
  console.log("S6 confirm and pay");
  await employer.waitForSelector("[data-test=btn-confirm]", { timeout: 20000 });
  await employer.click("[data-test=btn-confirm]");
  await employer.fill("[data-test=approved-minutes]", "240");
  await employer.click("[data-test=confirm-completion]");
  check((await waitStatus(employer, "PAID")) === "PAID", 'employer sees "Đã thanh toán"');
  await waitStatus(worker, "PAID");
  const net = await worker.locator("[data-test=net-pay]").innerText();
  check(net.includes("160.000"), `worker sees net pay ${net}`);
  await shot(worker, "s6-paid");
  await go(worker, "/sn/wallet");
  const wb = await worker.locator("[data-test=wallet-balance]").innerText();
  check(/₫/.test(wb), `worker wallet ${wb}`);
  await assertVietnamese(worker, "/sn/wallet (390)");

  // ---------------------------------------------------------------- S7 ratings
  console.log("S7 ratings");
  await employer.click("[data-test=btn-rate]");
  await employer.click("[data-test=star-5]");
  await employer.click("[data-test=rating-submit]");
  await go(worker, `/sn/my-shifts/${shiftId}`);
  await worker.waitForSelector("[data-test=btn-rate-employer]", { timeout: 15000 });
  await worker.click("[data-test=btn-rate-employer]");
  await worker.click("[data-test=star-4]");
  await worker.click("[data-test=rating-submit]");
  check((await waitStatus(employer, "RATED")) === "RATED", 'both rated -> "Đã đánh giá"');
  await shot(employer, "s7-rated");
  assertNoErrors(employer, "S6/S7 employer");
  assertNoErrors(worker, "S6/S7 worker");

  // ---------------------------------------------------------------- S9 dispute -> ops resolves
  console.log("S9 dispute -> ops resolves (1440)");
  const s9 = await api.post(
    "/shifts",
    employerToken,
    { work_location_id: (await api.get("/work-locations", employerToken))[0].id, title: "Phụ bếp (khiếu nại E2E)", skill_code: "phuc_vu", start_at: new Date(Date.now() + 15 * 60000).toISOString(), end_at: new Date(Date.now() + 255 * 60000).toISOString(), hourly_vnd: 40000 }
  );
  const s9id = s9.shifts[0].id;
  const s9worker = await api.waitFor("offer", async () => (await api.get(`/shifts/${s9id}`, employerToken)).offered_worker_ids?.[0]);
  const wtok = await api.login((await api.get(`/workers/${s9worker}/card`, employerToken)).phone_e164);
  await api.post(`/shifts/${s9id}/accept`, wtok);
  await api.waitFor("funded", async () => (await api.get(`/shifts/${s9id}`, employerToken)).status === "ESCROW_FUNDED");
  const pos = { lat: LOC.latitude, lng: LOC.longitude, accuracy_m: 10 };
  await api.post(`/shifts/${s9id}/check-in`, wtok, pos);
  await api.post(`/shifts/${s9id}/check-out`, wtok, pos);
  await go(employer, `/sn/employer/shifts/${s9id}`);
  await employer.waitForSelector("[data-test=btn-dispute]", { timeout: 20000 });
  await employer.click("[data-test=btn-dispute]");
  await employer.fill("[data-test=claimed-minutes]", "180");
  await employer.fill("#d-note", "Về sớm 1 tiếng");
  await employer.click("[data-test=send-dispute]");
  check((await waitStatus(employer, "DISPUTED")) === "DISPUTED", 'employer dispute -> "Đang khiếu nại"');
  const ops = await newPage(browser, "desktop");
  await loginUi(ops, "ops@flexiwork.local");
  await go(ops, "/sn/ops/exceptions");
  await assertVietnamese(ops, "/sn/ops/exceptions");
  await ops.waitForSelector("[data-test=exception-item]");
  await shot(ops, "s9-ops-queue");
  await ops.locator("[data-test=exception-item]", { hasText: "Phụ bếp (khiếu nại E2E)" }).first().click();
  await ops.waitForSelector("[data-test=exception-detail]");
  await assertVietnamese(ops, "/sn/ops/exceptions/:id");
  await ops.locator("button", { hasText: "Trả theo số giờ doanh nghiệp đề xuất" }).click();
  await ops.waitForSelector(".alert-light-success", { timeout: 15000 });
  check(true, "ops resolved the dispute (180 min)");
  await shot(ops, "s9-ops-resolved");
  check((await waitStatus(employer, "PAID")) === "PAID", "disputed shift paid after resolution");
  const refund = await employer.locator("[data-test=refund]").innerText().catch(() => "");
  check(refund.includes("44.000"), `employer refund ${refund}`);
  for (const p of ["/sn/ops/policies", "/sn/ops/workers", "/sn/ops/system", "/sn/ops/dlq", "/sn/notifications"]) {
    await go(ops, p);
    await ops.waitForTimeout(1200);
    await assertVietnamese(ops, p);
  }
  assertNoErrors(ops, "S9 ops");
  assertNoErrors(employer, "S9 employer");

  // ---------------------------------------------------------------- S8 no-show (needs SN_TIMER_SPEEDUP=10)
  console.log("S8 no-show branch (accelerated timers)");
  const s8 = await api.post("/shifts", employerToken, {
    work_location_id: (await api.get("/work-locations", employerToken))[0].id,
    title: "Phục vụ (không đến E2E)",
    skill_code: "phuc_vu",
    // starts in 6 min (dev min lead is 5 min): with SN_TIMER_SPEEDUP=10 the no-show timer fires after ~2 min
    start_at: new Date(Date.now() + 6 * 60000).toISOString(),
    end_at: new Date(Date.now() + 246 * 60000).toISOString(),
    hourly_vnd: 40000
  });
  const s8id = s8.shifts[0].id;
  const s8worker = await api.waitFor("offer", async () => (await api.get(`/shifts/${s8id}`, employerToken)).offered_worker_ids?.[0]);
  const w8 = await api.login((await api.get(`/workers/${s8worker}/card`, employerToken)).phone_e164);
  await api.post(`/shifts/${s8id}/accept`, w8);
  await go(employer, `/sn/employer/shifts/${s8id}`);
  await waitStatus(employer, "ESCROW_FUNDED");
  await employer.waitForFunction(() => /Ghi nhận không đến/.test(document.querySelector("[data-test=sn-timeline]")?.innerText || ""), null, { timeout: 240000 });
  check(true, 'timeline shows "Ghi nhận không đến" (no-show timer)');
  const after = await waitStatus(employer, ["POSTED", "MATCHED", "CANCELLED", "EXPIRED"], 60000);
  check(true, `after no-show the shift is ${after} (rematch or cancel+refund)`);
  await shot(employer, "s8-no-show");
  assertNoErrors(employer, "S8");

  await browser.close();
  console.log(`evidence: ${EVIDENCE}`);
  process.exit(result() ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
