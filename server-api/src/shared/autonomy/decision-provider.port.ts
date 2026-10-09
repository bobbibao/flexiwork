import { DecisionPoint } from './decision-points.constant';

export const DECISION_PROVIDER = 'DECISION_PROVIDER';

export interface DecisionContext {
  point: DecisionPoint;
  subjectType: string;
  subjectId: string;
  /** Facts the decision is based on (stored in decision_records.inputs). */
  inputs: Record<string, unknown>;
  /** Deterministic rule from the calling module; a future agent provider may ignore or refine it. */
  rule: (inputs: Record<string, unknown>) => DecisionOutcome;
}

export interface DecisionOutcome {
  outcome: string;
  confidence: number;
  rationale: string;
}

/**
 * Strategy seam for autonomous decisions (docs/ARCHITECTURE.md §13, item 5).
 * Today: RuleBasedDecisionProvider. Later: an agent-backed provider, with no change to callers.
 */
export interface DecisionProvider {
  readonly name: string;
  decide(context: DecisionContext): Promise<DecisionOutcome>;
}
