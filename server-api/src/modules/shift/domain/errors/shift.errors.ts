/** Domain errors carry a stable code; the API maps them to HTTP (409 / 422 / 403). */
export class ShiftDomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly kind: 'transition' | 'rule' | 'forbidden' = 'rule',
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export class ShiftTransitionError extends ShiftDomainError {
  constructor(command: string, status: string, actor: string) {
    super('SHIFT_INVALID_TRANSITION', `${command} is not allowed in state ${status} for ${actor}`, 'transition', { command, status, actor });
  }
}
