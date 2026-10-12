/*
 * No-show branch. Run the API with SN_TIMER_SPEEDUP=120 (development only):
 * the no-show timer (start + 15 min) then fires in ~40 s.
 */
const { get, post, login, waitFor, waitStatus, assert, topUp, postShift, offeredWorker } = require('./lib');

(async () => {
  console.log('No-show branch');
  const employer = await login('employer1@flexiwork.local');
  await topUp(employer, 1_000_000);
  const shift = await postShift(employer, { startInMin: 60, hours: 4, title: 'Phục vụ (no-show smoke)' });
  const { workerId, token: worker } = await offeredWorker(shift.id, employer);
  const before = (await get(`/workers/${workerId}/card`, employer)).reliability_score;
  await post(`/shifts/${shift.id}/accept`, worker);
  await waitStatus(shift.id, employer, 'ESCROW_FUNDED');
  assert(true, `worker #${workerId} accepted, escrow held; now not checking in`);

  const timeline = await waitFor(
    'no-show recorded',
    async () => {
      const t = await get(`/shifts/${shift.id}/timeline`, employer);
      return t.some((e) => e.type === 'shift.no_show_recorded') ? t : null;
    },
    120000,
    1000,
  );
  assert(timeline.some((e) => e.type === 'shift.no_show_recorded'), 'no-show recorded by the timer');
  const after = await waitFor('reliability updated', async () => {
    const c = await get(`/workers/${workerId}/card`, employer);
    return c.reliability_score < before ? c : null;
  });
  assert(after.reliability_score === Math.max(0, before - 20), `reliability ${before} -> ${after.reliability_score}`);

  const s = await waitFor('rematch or cancel', async () => {
    const t = await get(`/shifts/${shift.id}/timeline`, employer);
    return t.some((e) => ['shift.rematch_requested', 'shift.cancelled'].includes(e.type)) ? t : null;
  });
  const rematched = s.some((e) => e.type === 'shift.rematch_requested');
  assert(true, `no-show policy decided: ${rematched ? 'rematch (worker excluded)' : 'cancel + refund'}`);
  const detail = await get(`/shifts/${shift.id}`, employer);
  assert(detail.worker_id !== workerId, 'no-show worker is no longer assigned');
  const ops = await login('ops@flexiwork.local');
  const decisions = await get(`/ops/decisions?decision_point=no_show.handling&subject_id=${shift.id}`, ops);
  assert(decisions.length === 1, `decision recorded: ${decisions[0]?.outcome} (${decisions[0]?.rationale})`);
  console.log('NO-SHOW OK');
})().catch((e) => {
  console.error(e.message, e.body ? JSON.stringify(e.body) : '');
  process.exit(1);
});
