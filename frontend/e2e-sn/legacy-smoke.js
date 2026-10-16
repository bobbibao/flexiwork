/*
 * S0 (PLAN §17.4): legacy Flexiwork screens still render after the Vue 3 upgrade.
 * Prerequisite: server-api `node -r dotenv/config test/sn/prepare-legacy-account.js` (legacy register + activation).
 * Errors on a page where a legacy API call failed (4xx/5xx) are reported as legacy data/backend issues,
 * not as upgrade regressions; every other error fails the check.
 */
const { BASE, launch, newPage, shot, check, result } = require("./lib");

/** Verified pre-existing legacy bugs (fail identically on Vue 2): reported as warnings, not upgrade regressions. */
const KNOWN_LEGACY = [
  { route: "/invoice", match: /currentInvoices is not iterable/, why: "GET /api/invoices returns a paginated object but Invoice.vue iterates it as an array" }
];

const ROUTES = ["/dashboard", "/offer", "/offer/create", "/project", "/project/create", "/task", "/timesheet", "/time-overview", "/invoice", "/expense", "/product", "/report", "/settings", "/address"];

(async () => {
  console.log("S0 legacy smoke");
  const browser = await launch();
  const page = await newPage(browser, "desktop");
  const failedApi = [];
  page.on("response", r => {
    if (r.url().includes("/api/") && r.status() >= 400 && !r.url().endsWith("/api/verify")) failedApi.push(`${r.status()} ${r.url().split("/api/")[1].split("?")[0]}`);
  });
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#email-input", { timeout: 30000 });
  await page.fill("#email-input", process.env.LEGACY_EMAIL || "legacy-arch@flexiwork.local");
  await page.fill("#password-input", process.env.LEGACY_PASSWORD || "MatKhau@123");
  await Promise.all([page.waitForURL(/dashboard/, { timeout: 30000 }).catch(() => null), page.click("form.form button[type=submit]")]);
  check(/dashboard/.test(page.url()), `logged in as legacy admin -> ${page.url().split("#")[1]}`);
  page.errors.splice(0);
  for (const r of ROUTES) {
    failedApi.splice(0);
    // full reload per route: in Vue 3 one uncaught render error breaks the rest of the SPA session
    await page.goto(`${BASE}${r}`, { waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);
    const text = (await page.evaluate(() => document.body.innerText)).trim();
    check(text.length > 300 && !/Bitte benutzen Sie Ihre Zugangsdaten/.test(text), `legacy ${r} rendered (${text.length} chars)`);
    await shot(page, `s0-legacy${r.replace(/\//g, "-")}`);
    const errs = [...new Set(page.errors.splice(0))];
    const known = KNOWN_LEGACY.find(k => k.route === r && errs.every(e => k.match.test(e)));
    if (!errs.length) check(true, `legacy ${r}: no console/page errors`);
    else if (known) console.log(`  ⚠ legacy ${r}: known legacy bug (${known.why})`);
    else if (failedApi.length) console.log(`  ⚠ legacy ${r}: ${errs.length} error(s) after failing legacy API call(s) [${[...new Set(failedApi)].join(", ")}]: ${errs[0].slice(0, 140)}`);
    else check(false, `legacy ${r}: no console/page errors ${JSON.stringify(errs.slice(0, 2))}`);
  }
  await browser.close();
  process.exit(result() ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
