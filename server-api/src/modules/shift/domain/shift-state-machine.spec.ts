import { ShiftStatus as S } from './shift-status.enum';
import { ActorKind, availableCommands, canTransition, SHIFT_TRANSITIONS, ShiftCommandName } from './shift-state-machine';

const ALL_STATES = Object.values(S);
const ACTORS: ActorKind[] = ['employer', 'worker', 'system', 'ops'];

describe('Shift state machine (ARCHITECTURE §5.4)', () => {
  it('allows every listed (from, command, actor) transition', () => {
    for (const [command, t] of Object.entries(SHIFT_TRANSITIONS) as [ShiftCommandName, (typeof SHIFT_TRANSITIONS)[ShiftCommandName]][]) {
      if (command === 'PostShift') {
        expect(canTransition(command, null, 'employer')).toBe(true);
        continue;
      }
      for (const from of t.from) {
        for (const actor of t.actors) {
          const expected = !(command === 'CancelShift' && actor === 'employer' && from === S.NO_SHOW);
          expect([command, from, actor, canTransition(command, from, actor)]).toEqual([command, from, actor, expected]);
        }
      }
    }
  });

  it('rejects every command in states it does not list, for every actor', () => {
    for (const [command, t] of Object.entries(SHIFT_TRANSITIONS) as [ShiftCommandName, (typeof SHIFT_TRANSITIONS)[ShiftCommandName]][]) {
      for (const state of ALL_STATES.filter((s) => !t.from.includes(s))) {
        for (const actor of ACTORS) expect(canTransition(command, state, actor)).toBe(false);
      }
    }
  });

  it('rejects actors that are not allowed', () => {
    expect(canTransition('AcceptShift', S.MATCHED, 'employer')).toBe(false);
    expect(canTransition('ConfirmCompletion', S.CHECKED_OUT, 'worker')).toBe(false);
    expect(canTransition('ResolveDispute', S.DISPUTED, 'employer')).toBe(false);
    expect(canTransition('RecordEscrowFunded', S.ACCEPTED, 'worker')).toBe(false);
  });

  it('terminal states accept nothing', () => {
    for (const state of [S.RATED, S.CANCELLED, S.EXPIRED]) {
      for (const actor of ACTORS) expect(availableCommands(state, actor)).toEqual([]);
    }
  });

  it('lists available commands for introspection', () => {
    expect(availableCommands(S.MATCHED, 'worker').sort()).toEqual(['AcceptShift', 'DeclineOffer']);
    expect(availableCommands(S.CHECKED_OUT, 'employer').sort()).toEqual(['ConfirmCompletion', 'DisputeCompletion']);
    expect(availableCommands(S.ESCROW_FUNDED, 'employer')).toEqual(['CancelShift']);
  });
});
