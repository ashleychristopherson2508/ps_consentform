const CACHE_NAME = "photo-consent-v19";
const ASSETS = [
  "./",
  "index.html",
  "startup.html",
  "distribution.html",
  "terms.html",
  "styles.css",
  "app.js",
  "app.js?v=20260223",
  "manifest.json",
  "photographer.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "./assets/logo_trans.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  const isHtmlRequest =
    request.mode === "navigate" ||
    request.destination === "document" ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/";
  const isAppScript = url.pathname.endsWith("/app.js") || url.pathname.endsWith("app.js");

  if (isHtmlRequest || isAppScript) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
          return response;
        }),
    ),
  );
});
