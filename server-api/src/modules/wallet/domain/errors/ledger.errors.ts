export class UnbalancedJournalError extends Error {
  constructor(journalType: string, sum: number) {
    super(`Journal ${journalType} is not balanced (sum = ${sum})`);
  }
}

export class InsufficientFundsError extends Error {
  constructor(
    readonly accountCode: string,
    readonly availableVnd: number,
    readonly requiredVnd: number,
  ) {
    super(`Insufficient funds on ${accountCode}: available ${availableVnd}, required ${requiredVnd}`);
  }
}
