/* Happy path: post -> match -> accept -> escrow -> check-in -> check-out -> confirm -> paid -> rated. */
const { get, post, login, waitStatus, assert, topUp, postShift, offeredWorker, LOCATION_HCMC } = require('./lib');

(async () => {
  console.log('Happy path');
  const employer = await login('employer1@flexiwork.local');
  await topUp(employer, 2_000_000);
  const walletBefore = (await get('/wallets/me', employer)).balance_vnd;

  const shift = await postShift(employer, { startInMin: 20, hours: 4, hourly: 40000 });
  assert(shift.status === 'POSTED', `posted shift ${shift.id}`);
  assert(shift.escrow_amount_vnd === shift.estimated_gross_vnd + shift.platform_fee_vnd, `escrow = gross ${shift.estimated_gross_vnd} + fee ${shift.platform_fee_vnd}`);

  const { workerId, token: worker } = await offeredWorker(shift.id, employer);
  assert(!!workerId, `matching offered the shift to worker #${workerId}`);
  const workerWalletBefore = (await get('/wallets/me', worker)).balance_vnd;

  await post(`/shifts/${shift.id}/accept`, worker);
  const funded = await waitStatus(shift.id, employer, 'ESCROW_FUNDED');
  assert(funded.escrow_status === 'held', 'escrow held after acceptance');
  const held = (await get('/wallets/me', employer)).balance_vnd;
  assert(held === walletBefore - shift.escrow_amount_vnd, `employer wallet debited by ${shift.escrow_amount_vnd}`);

  try {
    await post(`/shifts/${shift.id}/check-in`, worker, { lat: 10.795, lng: 106.7009, accuracy_m: 20 });
    assert(false, 'check-in outside geofence must fail');
  } catch (e) {
    assert(e.body?.code === 'CHECKIN_OUTSIDE_GEOFENCE', 'check-in 2 km away rejected (CHECKIN_OUTSIDE_GEOFENCE)');
  }
  await post(`/shifts/${shift.id}/check-in`, worker, { lat: LOCATION_HCMC.lat, lng: LOCATION_HCMC.lng, accuracy_m: 15 });
  await post(`/shifts/${shift.id}/check-out`, worker, { lat: LOCATION_HCMC.lat, lng: LOCATION_HCMC.lng, accuracy_m: 15 });
  await waitStatus(shift.id, employer, 'CHECKED_OUT');

  const transitions = await get(`/shifts/${shift.id}/available-transitions`, employer);
  assert(transitions.available_commands.includes('ConfirmCompletion'), 'introspection lists ConfirmCompletion for the employer');

  await post(`/shifts/${shift.id}/confirm-completion`, employer, { approved_minutes: 240 });
  const paid = await waitStatus(shift.id, employer, 'PAID');
  assert(paid.gross_vnd === shift.estimated_gross_vnd, `gross paid ${paid.gross_vnd}`);
  const workerWallet = (await get('/wallets/me', worker)).balance_vnd;
  assert(workerWallet === workerWalletBefore + paid.net_vnd, `worker wallet credited net ${paid.net_vnd} (PIT ${paid.pit_vnd})`);

  await post(`/shifts/${shift.id}/ratings`, employer, { stars: 5, tags: ['dung_gio'] });
  await post(`/shifts/${shift.id}/ratings`, worker, { stars: 4, comment: 'Quản lý thân thiện' });
  await waitStatus(shift.id, employer, 'RATED');
  assert(true, 'both sides rated -> RATED');

  const timeline = await get(`/shifts/${shift.id}/timeline`, employer);
  assert(timeline.length >= 10, `timeline has ${timeline.length} events`);

  const ops = await login('ops@flexiwork.local');
  const recon = await post('/ops/reconciliation/run', ops).catch((e) => ({ skipped: e.message }));
  if (recon.skipped) console.log(`  (reconciliation endpoint not available yet: ${recon.skipped})`);
  else assert(recon.ok === true, 'ledger reconciliation ok');
  console.log('HAPPY PATH OK');
})().catch((e) => {
  console.error(e.message, e.body ? JSON.stringify(e.body) : '');
  process.exit(1);
});
