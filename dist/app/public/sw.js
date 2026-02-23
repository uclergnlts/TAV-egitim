self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  // No-op service worker to prevent 500 on /sw.js requests
});
