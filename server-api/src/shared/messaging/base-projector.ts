import { Transaction } from 'sequelize';
import { EventEnvelope } from '../events/event-envelope';

type ProjectionHandler = (env: EventEnvelope, t: Transaction | null) => Promise<void>;

/**
 * Template Method for projections: route by event type to a handler map.
 * Used both by live consumers and by the rebuild tool (t may be null there).
 */
export abstract class BaseProjector {
  abstract readonly projectionName: string;
  protected abstract handlers(): Record<string, ProjectionHandler>;

  async project(env: EventEnvelope, t: Transaction | null): Promise<void> {
    const handler = this.handlers()[env.type];
    if (handler) await handler.call(this, env, t);
  }

  /** Called by the rebuild tool before replaying from position 0. */
  async reset(): Promise<void> {}
}
