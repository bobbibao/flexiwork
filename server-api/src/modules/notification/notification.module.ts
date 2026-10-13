/* eslint-disable @typescript-eslint/no-explicit-any -- untyped boundary: raw SQL rows / JSON event payloads */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SendMailService } from 'src/shared/services/send-mail.service';
import { ShiftModule } from '../shift/shift.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationDispatcher } from './services/notification-dispatcher.service';
import { NotificationsGateway } from './services/notifications.gateway';
import { RealtimeService } from './services/realtime.service';
import { NOTIFICATION_CHANNELS } from './channels/notification-channel';
import { InAppChannel } from './channels/in-app.channel';
import { WebPushChannel } from './channels/web-push.channel';
import { FcmChannel } from './channels/fcm.channel';
import { EmailChannel } from './channels/email.channel';
import { SmsChannel } from './channels/sms.channel';

const CHANNELS = [InAppChannel, WebPushChannel, FcmChannel, EmailChannel, SmsChannel];

/** Notification (generic context): rules, channel strategies, Socket.IO, Web Push, FCM, email. */
@Module({
  imports: [ShiftModule, JwtModule.register({})],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationDispatcher,
    NotificationsGateway,
    RealtimeService,
    SendMailService,
    ...CHANNELS,
    { provide: NOTIFICATION_CHANNELS, inject: CHANNELS, useFactory: (...channels: any[]) => channels },
  ],
})
export class NotificationModule {}
