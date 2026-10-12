import { Injectable } from '@nestjs/common';
import { Delivery, NotificationChannel } from './notification-channel';
import { RealtimeService } from '../services/realtime.service';

/** The notification row is written by the dispatcher; this channel pushes it live over Socket.IO. */
@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly name = 'in_app' as const;
  constructor(private readonly realtime: RealtimeService) {}
  enabled() {
    return true;
  }
  async send(d: Delivery) {
    await this.realtime.emit(d.userId, 'notification.created', {
      id: d.notificationId,
      template_key: d.templateKey,
      title: d.title,
      body: d.body,
      url: d.url,
      data: d.data,
      created_at: new Date().toISOString(),
    });
    return true;
  }
}
