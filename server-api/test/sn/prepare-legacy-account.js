/*
 * Creates a fully initialised legacy ArchApp account through the legacy flow (POST /api/register +
 * activation), so the legacy smoke test (PLAN P9 / S0) runs against realistic data.
 * Dev only: reads the activation code from the database instead of the email.
 * Usage: DOTENV_CONFIG_PATH=env/sn/development.env node -r dotenv/config test/sn/prepare-legacy-account.js
 */
const { Client } = require('pg');
const API = process.env.SN_LEGACY_API || 'http://localhost:7001/api';
const EMAIL = process.env.LEGACY_EMAIL || 'legacy-arch@flexiwork.local';
const PASSWORD = 'MatKhau@123';

/** Legacy dashboards read SQL snippets from the `config` table; its seeder is not called on boot. */
async function seedLegacyConfig() {
  require('reflect-metadata');
  const { Sequelize } = require('sequelize-typescript');
  const Config = require('../../dist/database/models/config.model').default;
  const { seedData } = require('../../dist/database/seeders/config.seeder');
  const sequelize = new Sequelize({
    dialect: 'postgres', host: process.env.DB_HOST, port: Number(process.env.DB_PORT), username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME, models: [Config], logging: false, define: { timestamps: false },
  });
  await seedData();
  await new Promise((r) => setTimeout(r, 1500)); // seedData does not await its inserts
  await sequelize.close();
}

(async () => {
  await seedLegacyConfig();
  const db = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  await db.connect();
  const exists = await db.query(`SELECT id FROM users WHERE email = $1 AND password IS NOT NULL`, [EMAIL]);
  if (exists.rows.length) {
    console.log(`legacy account ready: ${EMAIL} / ${PASSWORD}`);
    return db.end();
  }
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, currency: 'CHF', language: 'de', company: 'Legacy Architektur AG', accept_term: true, architecture_template: true, vat_active: true }),
  });
  // Legacy quirk: without Mailgun credentials the activation mail fails AFTER the transaction committed,
  // so the endpoint answers 500 although the company, defaults and activation code exist. Continue if so.
  if (!res.ok) console.log(`register answered ${res.status} (expected in dev without Mailgun); continuing`);
  const { rows } = await db.query(
    `SELECT a.activation_code FROM user_activations a JOIN users u ON u.id = a.user_id WHERE u.email = $1 ORDER BY a.id DESC LIMIT 1`,
    [EMAIL],
  );
  const act = await fetch(`${API}/active-code/${rows[0].activation_code}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: PASSWORD, confirm_password: PASSWORD }),
  });
  if (!act.ok) throw new Error(`activation failed ${act.status} ${await act.text()}`);
  console.log(`legacy account created: ${EMAIL} / ${PASSWORD}`);
  await db.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
