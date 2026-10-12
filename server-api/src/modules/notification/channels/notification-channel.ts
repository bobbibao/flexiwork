export const NOTIFICATION_CHANNELS = 'NOTIFICATION_CHANNELS';

export type ChannelName = 'in_app' | 'web_push' | 'fcm' | 'email' | 'sms';

export interface Delivery {
  userId: number;
  email: string | null;
  phone: string | null;
  notificationId: string;
  templateKey: string;
  title: string;
  body: string;
  url: string;
  data: Record<string, unknown>;
}

/** Channel Strategy (docs/ARCHITECTURE.md §11.2). Returns false when the user cannot be reached (skipped). */
export interface NotificationChannel {
  readonly name: ChannelName;
  enabled(): boolean;
  send(delivery: Delivery): Promise<boolean>;
}
