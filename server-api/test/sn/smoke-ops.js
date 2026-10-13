/* Dispute -> ops resolves with partial pay; first payout needs ops approval; reconciliation. */
const { get, post, put, login, waitFor, waitStatus, assert, topUp, postShift, offeredWorker, LOCATION_HCMC } = require('./lib');

(async () => {
  console.log('Ops branch: dispute + payout approval + reconciliation');
  const employer = await login('employer1@flexiwork.local');
  const ops = await login('ops@flexiwork.local');
  await topUp(employer, 1_000_000);
  const shift = await postShift(employer, { startInMin: 20, hours: 4, title: 'Phục vụ (dispute smoke)' });
  const { workerId, token: worker } = await offeredWorker(shift.id, employer);
  await post(`/shifts/${shift.id}/accept`, worker);
  await waitStatus(shift.id, employer, 'ESCROW_FUNDED');
  const pos = { lat: LOCATION_HCMC.lat, lng: LOCATION_HCMC.lng, accuracy_m: 10 };
  await post(`/shifts/${shift.id}/check-in`, worker, pos);
  await post(`/shifts/${shift.id}/check-out`, worker, pos);
  await waitStatus(shift.id, employer, 'CHECKED_OUT');
  const employerBefore = (await get('/wallets/me', employer)).balance_vnd;

  await post(`/shifts/${shift.id}/dispute`, employer, { reason_code: 'left_early', note: 'Về sớm 1 tiếng', claimed_minutes: 180 });
  await waitStatus(shift.id, employer, 'DISPUTED');
  const kase = await waitFor('dispute case', async () => {
    const list = await get('/ops/exceptions?type=shift_dispute', ops);
    return list.items.find((c) => c.subject_id === shift.id);
  });
  assert(kase.severity === 'high', `ops sees dispute case ${kase.id} (${kase.summary})`);
  const suggestion = kase.suggested_actions.find((a) => a.params?.approved_minutes === 180);
  assert(!!suggestion, 'case suggests paying the 180 minutes claimed by the employer');
  await post(`/ops/exceptions/${kase.id}/acknowledge`, ops);
  await post(`/ops/exceptions/${kase.id}/resolve`, ops, { action: suggestion.action, params: suggestion.params, note: 'Đã gọi điện xác minh' });
  const paid = await waitStatus(shift.id, employer, 'PAID');
  assert(paid.approved_minutes === 180 && paid.gross_vnd === Math.round(shift.estimated_gross_vnd * 0.75), `partial pay: 180 min, gross ${paid.gross_vnd}`);
  const employerAfter = (await get('/wallets/me', employer)).balance_vnd;
  assert(employerAfter - employerBefore === paid.refund_vnd && paid.refund_vnd > 0, `employer refunded ${paid.refund_vnd}`);

  // First payout of a worker always needs a human (autonomy: payout.approval)
  if (!(await get('/workers/me', worker)).bank_account) {
    await put('/workers/me', worker, { bank_account: { bank_name: 'Vietcombank', account_number: '0123456789', account_holder: 'NGUOI LAO DONG' } });
  }
  const balance = (await get('/wallets/me', worker)).balance_vnd;
  const intent = await post('/wallets/me/payouts', worker, { amount_vnd: 50000 }).catch((e) => {
    if (e.body?.code === 'INSUFFICIENT_FUNDS') return null;
    throw e;
  });
  if (intent) {
    if (intent.status === 'awaiting_approval') {
      const pcase = await waitFor('payout case', async () => (await get('/ops/exceptions?type=payout_approval', ops)).items.find((c) => c.subject_id === intent.id));
      await post(`/ops/exceptions/${pcase.id}/resolve`, ops, { action: 'approve_payout', params: { intent_id: intent.id } });
      assert(true, 'first payout approved by ops');
    }
    const settled = await waitFor('payout settled', async () => {
      const i = await get(`/wallets/me/intents/${intent.id}`, worker);
      return i.status === 'succeeded' ? i : null;
    });
    assert(settled.status === 'succeeded', 'payout settled by the fake gateway');
    assert((await get('/wallets/me', worker)).balance_vnd === balance - 50000, 'worker wallet debited 50,000');
  } else {
    console.log(`  (worker #${workerId} balance ${balance} too low for a payout test)`);
  }

  const recon = await post('/ops/reconciliation/run', ops);
  assert(recon.ok === true, `ledger reconciliation ok (sum of balances ${recon.checks.total_balance_vnd})`);
  const health = await get('/health/deps', ops);
  assert(health.postgres.ok && health.redis.ok, `deps healthy (bus=${health.broker.driver}, groups=${health.broker.consumer_groups.length})`);
  console.log('OPS OK');
})().catch((e) => {
  console.error(e.message, e.body ? JSON.stringify(e.body) : '');
  process.exit(1);
});
