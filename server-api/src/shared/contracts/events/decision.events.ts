export const DECISION_EVENTS = {
  RECORDED: 'decision.recorded',
} as const;

export interface DecisionRecordedPayload {
  decision_id: string;
  decision_point: string;
  subject_type: string;
  subject_id: string;
  mode: 'manual' | 'suggest' | 'auto';
  outcome: string;
  confidence: number;
  rationale: string;
  provider: string;
  executed: boolean;
}
