import { Injectable } from '@nestjs/common';
import { SendMailService } from 'src/shared/services/send-mail.service';
import { Delivery, NotificationChannel } from './notification-channel';

/** Reuses the existing Mailgun SendMailService (plain text, Vietnamese copy). */
@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly name = 'email' as const;
  constructor(private readonly mail: SendMailService) {}
  enabled() {
    return !!process.env.MAILGUN_PRIVATE_KEY && process.env.MAILGUN_PRIVATE_KEY !== 'dev-placeholder';
  }
  async send(d: Delivery) {
    if (!d.email) return false;
    const base = process.env.FRONTEND_URL || '';
    return this.mail.sendMailMessage(d.email, d.title, `${d.body}\n\n${base}/#${d.url}`);
  }
}
