import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import PushSubscription from 'src/database/models/push-subscriptions.model';
import { snConfig } from 'src/shared/sn-runtime';
import { Delivery, NotificationChannel } from './notification-channel';

/** Web Push with VAPID keys (docs/ARCHITECTURE.md §11.2). Prunes subscriptions the push service reports gone. */
@Injectable()
export class WebPushChannel implements NotificationChannel {
  readonly name = 'web_push' as const;
  private readonly logger = new Logger(WebPushChannel.name);
  private configured = false;

  enabled() {
    const c = snConfig();
    if (!c.VAPID_PUBLIC_KEY || !c.VAPID_PRIVATE_KEY) return false;
    if (!this.configured) {
      webpush.setVapidDetails(c.VAPID_SUBJECT, c.VAPID_PUBLIC_KEY, c.VAPID_PRIVATE_KEY);
      this.configured = true;
    }
    return true;
  }

  async send(d: Delivery) {
    const subs = await PushSubscription.findAll({ where: { user_id: d.userId, platform: 'webpush' } });
    if (!subs.length) return false;
    const payload = JSON.stringify({ title: d.title, body: d.body, url: `/#${d.url}`, tag: d.templateKey, data: d.data });
    let delivered = false;
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as any }, payload, { TTL: 3600 });
        delivered = true;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) await sub.destroy();
        else this.logger.warn(`web push failed for user ${d.userId}: ${err?.statusCode ?? err}`);
      }
    }
    return delivered;
  }
}
