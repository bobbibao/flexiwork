/** After a no-show: rematch while at least half of the shift remains, else cancel and refund (§5.6). */
export class NoShowPolicy {
  decide(startAt: Date, endAt: Date, now: Date): 'rematch' | 'cancel' {
    const duration = endAt.getTime() - startAt.getTime();
    const remaining = endAt.getTime() - now.getTime();
    return remaining >= duration * 0.5 ? 'rematch' : 'cancel';
  }
}
