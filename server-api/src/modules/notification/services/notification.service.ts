import { Injectable } from '@nestjs/common';
import Notification from 'src/database/models/notifications.model';
import PushSubscription from 'src/database/models/push-subscriptions.model';
import NotificationPreference from 'src/database/models/notification-preferences.model';
import { UnitOfWork } from 'src/shared/event-store/unit-of-work';
import { notFound } from 'src/shared/utils/coded.error';
import { snConfig } from 'src/shared/sn-runtime';

@Injectable()
export class NotificationService {
  constructor(private readonly uow: UnitOfWork) {}

  async list(userId: number, page = 1, pageSize = 20) {
    const size = Math.min(Math.max(pageSize, 1), 100);
    const { rows, count } = await Notification.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: size,
      offset: (Math.max(page, 1) - 1) * size,
    });
    const unread = await Notification.count({ where: { user_id: userId, read_at: null } });
    return { items: rows, total_items: count, unread, page, page_size: size, total_pages: Math.ceil(count / size) };
  }

  async markRead(userId: number, id: string) {
    const n = await Notification.findOne({ where: { id, user_id: userId } });
    if (!n) throw notFound('NOTIFICATION_NOT_FOUND', 'Notification not found');
    if (!n.read_at) {
      n.read_at = new Date();
      await n.save();
    }
    return n;
  }

  async markAllRead(userId: number) {
    const [count] = await Notification.update({ read_at: new Date() }, { where: { user_id: userId, read_at: null } });
    return { updated: count };
  }

  vapidPublicKey() {
    return { public_key: snConfig().VAPID_PUBLIC_KEY || null };
  }

  async subscribe(userId: number, sub: { platform: string; endpoint: string; keys?: Record<string, string>; user_agent?: string }) {
    await this.uow.execute(
      `INSERT INTO push_subscriptions (id, user_id, platform, endpoint, keys, user_agent, created_at, last_seen_at)
       VALUES (gen_random_uuid(), :userId, :platform, :endpoint, CAST(:keys AS JSONB), :ua, now(), now())
       ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, keys = EXCLUDED.keys, last_seen_at = now()`,
      { userId, platform: sub.platform, endpoint: sub.endpoint, keys: JSON.stringify(sub.keys ?? null), ua: sub.user_agent ?? null },
    );
    const row = await PushSubscription.findOne({ where: { endpoint: sub.endpoint } });
    return { id: row?.id };
  }

  async unsubscribe(userId: number, id: string) {
    await PushSubscription.destroy({ where: { id, user_id: userId } });
    return { deleted: true };
  }

  async preferences(userId: number) {
    const p = await NotificationPreference.findByPk(userId);
    return { channels: { in_app: true, web_push: true, email: true, ...(p?.channels ?? {}) }, templates: p?.templates ?? {} };
  }

  async updatePreferences(userId: number, channels: Record<string, boolean>) {
    await this.uow.execute(
      `INSERT INTO notification_preferences (user_id, channels, templates, updated_at) VALUES (:userId, CAST(:channels AS JSONB), '{}', now())
       ON CONFLICT (user_id) DO UPDATE SET channels = EXCLUDED.channels, updated_at = now()`,
      { userId, channels: JSON.stringify({ ...channels, in_app: true }) },
    );
    return this.preferences(userId);
  }
}
