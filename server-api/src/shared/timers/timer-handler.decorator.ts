import { SetMetadata } from '@nestjs/common';

export const TIMER_HANDLER_METADATA = 'sn:timer-handler';

/** Marks a provider method as the handler of one timer type: `(payload) => Promise<void>`. */
export const TimerHandler = (type: string) => SetMetadata(TIMER_HANDLER_METADATA, type);
