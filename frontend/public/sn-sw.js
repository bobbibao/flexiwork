/* Shift Network service worker: Web Push display + click-through (docs/ARCHITECTURE.md §17.6). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Flexiwork", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Flexiwork";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      tag: data.tag,
      icon: "/media/logos/sn-icon-192.png",
      badge: "/media/logos/sn-icon-192.png",
      data: { url: data.url || "/#/sn" },
      lang: "vi"
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/#/sn";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
