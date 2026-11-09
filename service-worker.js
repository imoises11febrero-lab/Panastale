const CACHE_NAME = "panastale-v5";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// INSTALACIÓN
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(FILES_TO_CACHE);
      await self.skipWaiting();
    })
  );
});

// ACTIVACIÓN
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      await Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })
  );
});

// ACTUALIZACIÓN DE ARCHIVOS
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(async response => {

        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);

          await cache.put(
            event.request,
            response.clone()
          );
        }

        return response;
      })
      .catch(async () => {

        const cached = await caches.match(event.request);

        if (cached) return cached;

        return new Response(
          "No hay conexión y este archivo no está guardado.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain"
            }
          }
        );
      })
  );
});
