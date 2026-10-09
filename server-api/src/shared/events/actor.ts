export type ActorType = 'user' | 'system' | 'agent';

/** Who issued a command / caused an event (docs/ARCHITECTURE.md §13). */
export interface Actor {
  type: ActorType;
  id: string;
  role?: string;
  on_behalf_of?: string;
}

export const userActor = (user: { id: number | string; role?: string | null }): Actor => ({
  type: 'user',
  id: String(user.id),
  role: user.role ?? undefined,
});

export const systemActor = (component: string): Actor => ({ type: 'system', id: component });
