/** Decision points with an autonomy mode (docs/ARCHITECTURE.md §13, item 4). Seeded in autonomy_policies. */
export const DECISION_POINTS = {
  MATCHING_DISPATCH: 'matching.dispatch',
  ESCROW_AUTO_HOLD: 'escrow.auto_hold',
  NO_SHOW_HANDLING: 'no_show.handling',
  COMPLETION_AUTO_CONFIRM: 'completion.auto_confirm',
  DISPUTE_RESOLUTION: 'dispute.resolution',
  PAYOUT_APPROVAL: 'payout.approval',
  WORKER_SUSPENSION: 'worker.suspension',
  PAYOUTS_ENABLED: 'payouts.enabled',
} as const;

export type DecisionPoint = (typeof DECISION_POINTS)[keyof typeof DECISION_POINTS];

export type AutonomyMode = 'manual' | 'suggest' | 'auto';
