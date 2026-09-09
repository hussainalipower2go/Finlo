self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Finlo",
    body: "A payment is due today. Check your Finlo app.",
    url: "/dashboard#upcoming",
  };
  try {
    const data = event.data ? event.data.json() : null;
    if (data) payload = { ...payload, ...data };
  } catch {
    /* ignore malformed payload, use defaults */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Finlo", {
      body: payload.body,
      icon: "/finlo-brand-mark.png",
      badge: "/finlo-brand-mark.png",
      requireInteraction: true,
      data: { url: payload.url || "/dashboard#upcoming" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    (event.notification.data && event.notification.data.url) || "/dashboard#upcoming",
    self.location.origin
  ).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            client.navigate(target).catch(() => {});
          }
          return;
        }
      }
      return self.clients.openWindow(target);
    })
  );
});