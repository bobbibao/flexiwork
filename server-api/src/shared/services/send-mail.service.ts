import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import Mailgun, { MailgunClientOptions } from 'mailgun.js';
import { IMailgunClient } from 'mailgun.js/Interfaces';
import * as path from 'path';
import * as fs from 'fs';
import { MAIL_TEMPLATES_FOLDER_PATH } from '../constants/export.constants';

export enum MailTemplates {
  NEW_PASSWORD = 'newpassword.html',
  REGISTRATION = 'registration.html',
  RESET_PASSWORD = 'resetpassword.html',
}

interface MailBodyContext {
  [key: string]: string;
}

@Injectable()
export class SendMailService {
  private readonly logger = new Logger(SendMailService.name);
  private readonly MAILGUN_BASE_URL: string;
  private readonly MAILGUN_SENDER: string;
  private readonly MAILGUN_DOMAIN: string;
  private readonly MAILGUN_PRIVATE_KEY: string;
  private readonly MAILGUN_OPTIONS: MailgunClientOptions;
  private readonly mailgunClient: IMailgunClient;
  private readonly MAIL_TEMPLATES_FOLDER: string;

  constructor(private readonly configService: ConfigService) {
    const mailgun = new Mailgun(FormData);

    this.MAILGUN_BASE_URL = this.configService.get<string>('MAILGUN_BASE_URL', 'mailgun_base_url');
    this.MAILGUN_SENDER = this.configService.get<string>('MAILGUN_SENDER', 'mailgun_sender');
    this.MAILGUN_DOMAIN = this.configService.get<string>('MAILGUN_DOMAIN', 'mailgun_domain');
    this.MAILGUN_PRIVATE_KEY = this.configService.get<string>('MAILGUN_PRIVATE_KEY', 'mailgun_private_key');
    this.MAILGUN_OPTIONS = {
      username: this.MAILGUN_SENDER,
      key: this.MAILGUN_PRIVATE_KEY,
      url: this.MAILGUN_BASE_URL,
    };
    this.MAIL_TEMPLATES_FOLDER = path.join(__dirname, '..', '..', MAIL_TEMPLATES_FOLDER_PATH);

    this.mailgunClient = mailgun.client(this.MAILGUN_OPTIONS);
  }

  async sendMail(
    to: string,
    subject: string,
    template: MailTemplates,
    context: MailBodyContext = {},
  ): Promise<boolean> {
    try {
      const templatePath = path.join(this.MAIL_TEMPLATES_FOLDER, template);
      let templateSource = fs.readFileSync(templatePath, 'utf8');

      // Replace values in template context
      for (const key of Object.keys(context)) {
        const value = context[key];
        templateSource = templateSource.replace(`{{.${key.toUpperCase()}}}`, value);
      }

      // Send mail
      const result = await this.mailgunClient.messages.create(this.MAILGUN_DOMAIN, {
        from: this.MAILGUN_SENDER,
        to: [to],
        subject,
        html: templateSource,
      });

      return result.status === 200;
    } catch (error) {
      this.logger.error('Error when sending mail: ', error);
      return false;
    }
  }

  async sendMailMessage(to: string, subject: string, text: string): Promise<boolean> {
    try {
      const result = await this.mailgunClient.messages.create(this.MAILGUN_DOMAIN, {
        from: this.MAILGUN_SENDER,
        to: [to],
        subject,
        text,
      });

      return result.status === 200;
    } catch (error) {
      this.logger.error('Error when sending mail: ', error);
      return false;
    }
  }
}
