/*
 * Playwright helpers for the Shift Network UI checks (docs/PLAN.md §17).
 * The PLAN describes these checks for Playwright MCP; this runner drives the same scenarios
 * with the Playwright library so they can run unattended (yarn e2e:sn).
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.SN_WEB || "http://localhost:8080/#";
const EVIDENCE = process.env.SN_EVIDENCE || path.join(require("os").tmpdir(), "flexiwork-e2e-evidence");
fs.mkdirSync(EVIDENCE, { recursive: true });

const VIEWPORTS = { mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };

async function launch() {
  return chromium.launch({ headless: true });
}

/** New page with console-error capture and an optional geolocation stub. */
async function newPage(browser, viewport = "desktop", geo) {
  const context = await browser.newContext({ viewport: VIEWPORTS[viewport], locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh", ...(geo && { geolocation: geo, permissions: ["geolocation"] }) });
  // Third-party fonts are not reachable in CI/sandboxes and would block DOMContentLoaded.
  await context.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const page = await context.newPage();
  page.errors = [];
  // Known legacy behaviour: App.vue calls a protected API on mount before login (401) - not a regression.
  page.on("pageerror", e => {
    if (process.env.E2E_STACK) console.log("STACK", (e.stack || "").split("\n").slice(0, 6).join(" <- "));
    if (!/ApiService Error: Request failed with status code 401/.test(e.message)) page.errors.push(`pageerror: ${e.message}`);
  });
  page.on("console", m => {
    if (m.type() === "error" && !/Failed to load resource|favicon|ERR_|net::|status code 401/.test(m.text())) page.errors.push(`console: ${m.text().slice(0, 300)}`);
  });
  return page;
}

async function shot(page, name) {
  const file = path.join(EVIDENCE, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

/** PLAN §17.3: Vietnamese-only check, run in the page. */
async function vietnameseCheck(page) {
  return page.evaluate(() => {
    const t = document.body.innerText;
    const missingKeys = t.match(/\b(sn|menu|button|common)\.[A-Za-z_.]+\b/g) || [];
    const foreign = ["Speichern", "Löschen", "Abbrechen", "Projekt", "Rechnung", "Offerte", "Save", "Cancel", "Delete", "Submit", "Loading", "Search", "Settings"].filter(w =>
      new RegExp(`\\b${w}\\b`).test(t)
    );
    return { lang: document.documentElement.lang, missingKeys, foreign, scrollWidth: document.documentElement.scrollWidth, width: window.innerWidth };
  });
}

let failures = 0;
function check(cond, message) {
  if (cond) console.log(`  ✔ ${message}`);
  else {
    failures += 1;
    console.log(`  ✘ ${message}`);
  }
}

async function assertVietnamese(page, label) {
  const r = await vietnameseCheck(page);
  check(r.lang === "vi", `${label}: html lang="vi"`);
  check(!r.missingKeys.length, `${label}: no missing i18n keys ${r.missingKeys.length ? JSON.stringify(r.missingKeys.slice(0, 5)) : ""}`);
  check(!r.foreign.length, `${label}: no DE/EN UI words ${r.foreign.length ? JSON.stringify(r.foreign) : ""}`);
  check(r.scrollWidth <= r.width + 1, `${label}: no horizontal scroll (${r.scrollWidth}px <= ${r.width}px)`);
}

function assertNoErrors(page, label) {
  const errs = page.errors.splice(0);
  check(!errs.length, `${label}: no console/page errors ${errs.length ? JSON.stringify(errs.slice(0, 3)) : ""}`);
}

const result = () => failures;

module.exports = { BASE, EVIDENCE, launch, newPage, shot, vietnameseCheck, assertVietnamese, assertNoErrors, check, result };
