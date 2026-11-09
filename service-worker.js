
const CACHE_NAME = "panastale-v6";
const MUSIC_CACHE = "panastale-musica-v1";

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
          .filter(key =>
            key !== CACHE_NAME &&
            key !== MUSIC_CACHE
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })
  );
});

// DETECTAR MÚSICA
function isMusic(request) {
  const url = new URL(request.url);

  return (
    url.origin === self.location.origin &&
    url.pathname.toLowerCase().includes("/musica/") &&
    url.pathname.toLowerCase().endsWith(".mp3")
  );
}

// SOLICITUDES
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  if (isMusic(event.request)) {
    event.respondWith(
      (async () => {
        const musicCache = await caches.open(MUSIC_CACHE);

        try {
          const response = await fetch(event.request);

          if (response.ok && response.type === "basic") {
            await musicCache.put(
              event.request,
              response.clone()
            );
          }

          return response;

        } catch (error) {
          const cached = await musicCache.match(event.request);

          if (cached) return cached;

          return new Response("Música no disponible", {
            status: 503
          });
        }
      })()
    );

    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);

          await cache.put(
            event.request,
            response.clone()
          );
        }

        return response;

      } catch (error) {
        const cached = await caches.match(event.request);

        if (cached) return cached;

        return new Response("Archivo no disponible", {
          status: 503
        });
      }
    })()
  );
});
