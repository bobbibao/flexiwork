import { Injectable } from '@nestjs/common';
import { Delivery, NotificationChannel } from './notification-channel';

/** Port for SMS brandname / Zalo ZNS (⚠️ Q4: provider not chosen). Disabled in v1. */
@Injectable()
export class SmsChannel implements NotificationChannel {
  readonly name = 'sms' as const;
  enabled() {
    return false;
  }
  async send(_d: Delivery) {
    return false;
  }
}
