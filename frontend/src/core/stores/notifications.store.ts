/** In-app notifications + Socket.IO live updates + Web Push opt-in (docs/ARCHITECTURE.md §11, §17.6). */
import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";
import { snApi, SN_TOKEN_KEY } from "@/api/sn-api";
import { SN_NOTIFICATIONS } from "@/api/sn-endpoints";

export interface SnNotification {
  id: string;
  template_key: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

let socket: Socket | null = null;
const listeners = new Set<(n: SnNotification) => void>();

export const useNotificationsStore = defineStore("snNotifications", {
  state: () => ({ items: [] as SnNotification[], unread: 0, connected: false, pushState: "unknown" as "unknown" | "unsupported" | "denied" | "enabled" | "available" }),
  actions: {
    async load() {
      const page = await snApi.get<{ items: SnNotification[]; unread: number }>(SN_NOTIFICATIONS.LIST, { page_size: 30 });
      this.items = page.items;
      this.unread = page.unread;
    },
    async markRead(id: string) {
      await snApi.post(SN_NOTIFICATIONS.READ(id));
      const n = this.items.find(i => i.id === id);
      if (n && !n.read_at) {
        n.read_at = new Date().toISOString();
        this.unread = Math.max(0, this.unread - 1);
      }
    },
    async markAllRead() {
      await snApi.post(SN_NOTIFICATIONS.READ_ALL);
      this.items.forEach(i => (i.read_at = i.read_at || new Date().toISOString()));
      this.unread = 0;
    },
    /** Live channel: the API relays notification.created to room user:{id}. */
    connect() {
      const token = localStorage.getItem(SN_TOKEN_KEY);
      if (!token || socket) return;
      socket = io("/sn", { path: "/socket.io", auth: { token }, transports: ["websocket", "polling"] });
      socket.on("ready", () => (this.connected = true));
      socket.on("disconnect", () => (this.connected = false));
      socket.on("notification.created", (n: SnNotification) => {
        this.items.unshift({ ...n, read_at: null });
        this.unread += 1;
        listeners.forEach(fn => fn(n));
      });
    },
    disconnect() {
      socket?.disconnect();
      socket = null;
      this.connected = false;
    },
    onNotification(fn: (n: SnNotification) => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async detectPush() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        this.pushState = "unsupported";
        return;
      }
      if (Notification.permission === "denied") this.pushState = "denied";
      else {
        const reg = await navigator.serviceWorker.getRegistration("/sn-sw.js");
        const sub = await reg?.pushManager.getSubscription();
        this.pushState = sub ? "enabled" : "available";
      }
    },
    /** Registers the service worker and a Web Push subscription (VAPID key from the API). */
    async enablePush() {
      const { public_key } = await snApi.get<{ public_key: string | null }>(SN_NOTIFICATIONS.VAPID);
      if (!public_key) throw new Error("PUSH_NOT_CONFIGURED");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        this.pushState = "denied";
        return;
      }
      const reg = await navigator.serviceWorker.register("/sn-sw.js");
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(public_key) });
      const json: any = sub.toJSON();
      await snApi.post(SN_NOTIFICATIONS.SUBSCRIPTIONS, { platform: "webpush", endpoint: json.endpoint, keys: json.keys, user_agent: navigator.userAgent.slice(0, 300) });
      this.pushState = "enabled";
    }
  }
});

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
