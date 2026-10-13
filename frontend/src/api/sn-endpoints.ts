/** Shift Network endpoint builders (relative to /api/sn). */
export const SN_AUTH = {
  LOGIN: "/auth/login",
  REGISTER_WORKER: "/auth/worker/register",
  REGISTER_EMPLOYER: "/auth/employer/register",
  ME: "/me"
};

export const SN_PROFILE = {
  WORKER_ME: "/workers/me",
  WORKER_CARD: (id: number) => `/workers/${id}/card`,
  SKILLS: "/skills",
  EMPLOYER_ME: "/employers/me",
  LOCATIONS: "/work-locations",
  LOCATION: (id: string) => `/work-locations/${id}`,
  LOCATION_QR: (id: string) => `/work-locations/${id}/check-in-qr`
};

export const SN_SHIFTS = {
  CREATE: "/shifts",
  QUOTE: "/shifts/quote",
  EMPLOYER_LIST: "/employer/shifts",
  EMPLOYER_COUNTS: "/employer/shifts/counts",
  DETAIL: (id: string) => `/shifts/${id}`,
  TIMELINE: (id: string) => `/shifts/${id}/timeline`,
  TRANSITIONS: (id: string) => `/shifts/${id}/available-transitions`,
  DIRECT_OFFER: (id: string) => `/shifts/${id}/direct-offer`,
  CANCEL: (id: string) => `/shifts/${id}/cancel`,
  CONFIRM: (id: string) => `/shifts/${id}/confirm-completion`,
  DISPUTE: (id: string) => `/shifts/${id}/dispute`,
  RATE: (id: string) => `/shifts/${id}/ratings`,
  NEARBY: "/shifts/nearby",
  OFFERS: "/worker/offers",
  WORKER_LIST: "/worker/shifts",
  ACCEPT: (id: string) => `/shifts/${id}/accept`,
  DECLINE: (id: string) => `/shifts/${id}/decline`,
  WITHDRAW: (id: string) => `/shifts/${id}/withdraw`,
  CHECK_IN: (id: string) => `/shifts/${id}/check-in`,
  CHECK_OUT: (id: string) => `/shifts/${id}/check-out`,
  RESOLVE_DISPUTE: (id: string) => `/shifts/${id}/resolve-dispute`
};

export const SN_WALLET = {
  ME: "/wallets/me",
  STATEMENT: "/wallets/me/statement",
  TOP_UPS: "/wallets/me/top-ups",
  PAYOUTS: "/wallets/me/payouts",
  INTENT: (id: string) => `/wallets/me/intents/${id}`
};

export const SN_RATINGS = { RECEIVED: "/ratings/received" };

export const SN_NOTIFICATIONS = {
  LIST: "/notifications",
  READ: (id: string) => `/notifications/${id}/read`,
  READ_ALL: "/notifications/read-all",
  VAPID: "/push/vapid-public-key",
  SUBSCRIPTIONS: "/push-subscriptions",
  PREFERENCES: "/notification-preferences"
};

export const SN_OPS = {
  EXCEPTIONS: "/ops/exceptions",
  EXCEPTION: (id: string) => `/ops/exceptions/${id}`,
  ACK: (id: string) => `/ops/exceptions/${id}/acknowledge`,
  RESOLVE: (id: string) => `/ops/exceptions/${id}/resolve`,
  POLICIES: "/ops/autonomy-policies",
  POLICY: (point: string) => `/ops/autonomy-policies/${encodeURIComponent(point)}`,
  DECISIONS: "/ops/decisions",
  DLQ: "/ops/dlq",
  DLQ_REPLAY: (id: string) => `/ops/dlq/${id}/replay`,
  RECON_RUN: "/ops/reconciliation/run",
  RECON_LATEST: "/ops/reconciliation/latest",
  WORKERS: "/ops/workers",
  WORKER_VERIFY: (id: number) => `/ops/workers/${id}/verify`,
  WORKER_SUSPEND: (id: number) => `/ops/workers/${id}/suspend`,
  WORKER_UNSUSPEND: (id: number) => `/ops/workers/${id}/unsuspend`,
  SHIFTS: "/ops/shifts",
  HEALTH: "/health/deps"
};
