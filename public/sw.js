self.addEventListener("install", () => self.skipWaiting());
// ponytail: placeholder service worker so the PWA shell stops 404ing in dev.
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
