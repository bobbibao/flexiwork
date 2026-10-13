/* yarn e2e:sn -> legacy smoke (S0) then Shift Network scenarios (S1-S10). */
const { execSync } = require("child_process");
const run = f => execSync(`node ${__dirname}/${f}`, { stdio: "inherit" });
let failed = false;
for (const f of ["legacy-smoke.js", "sn-flows.js"]) {
  try {
    run(f);
  } catch {
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
