/* Minimal service worker - enables “Install app” / PWA criteria on Chromium.
 * v2: canonical origin is https://mcbuleli.com (legacy .org installs should reinstall). */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});
