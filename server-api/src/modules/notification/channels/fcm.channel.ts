/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Injectable, Logger } from '@nestjs/common';
import PushSubscription from 'src/database/models/push-subscriptions.model';
import { snConfig } from 'src/shared/sn-runtime';
import { Delivery, NotificationChannel } from './notification-channel';

/** FCM adapter: active only when FCM_CREDENTIALS_PATH is set (for a future mobile app). Lazy-loads firebase-admin. */
@Injectable()
export class FcmChannel implements NotificationChannel {
  readonly name = 'fcm' as const;
  private readonly logger = new Logger(FcmChannel.name);
  private messaging: any = null;

  enabled() {
    return !!snConfig().FCM_CREDENTIALS_PATH;
  }

  private client() {
    if (this.messaging) return this.messaging;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admin = require('firebase-admin');
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- credentials file path comes from configuration at runtime
    const app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(require(snConfig().FCM_CREDENTIALS_PATH)) });
    this.messaging = app.messaging();
    return this.messaging;
  }

  async send(d: Delivery) {
    const subs = await PushSubscription.findAll({ where: { user_id: d.userId, platform: 'fcm' } });
    if (!subs.length) return false;
    const res = await this.client().sendEachForMulticast({
      tokens: subs.map((s) => s.endpoint),
      notification: { title: d.title, body: d.body },
      data: { url: d.url, template_key: d.templateKey },
    });
    res.responses.forEach((r: any, i: number) => {
      if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') void subs[i].destroy();
    });
    if (res.failureCount) this.logger.warn(`fcm: ${res.failureCount} failures for user ${d.userId}`);
    return res.successCount > 0;
  }
}
