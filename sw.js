const CACHE_NAME = "estoque-v2";

const ARQUIVOS_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ARQUIVOS_CACHE);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  const url = new URL(req.url);

  // Para HTML / JS / CSS: tenta rede primeiro
  if (
    req.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css")
  ) {
    event.respondWith(
      fetch(req)
        .then(function (response) {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(req, copia);
          });
          return response;
        })
        .catch(function () {
          return caches.match(req);
        })
    );
    return;
  }

  // Para os outros arquivos: cache primeiro
  event.respondWith(
    caches.match(req).then(function (response) {
      return response || fetch(req);
    })
  );
});
