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
        .filter(key =>
  key !== CACHE_NAME &&
  key !== "panastale-musica-v1"
)
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })
  );
});
async function cacheMusic(request, response) {
  const url = new URL(request.url);

  if (
    url.origin === self.location.origin &&
    url.pathname.toLowerCase().includes("/musica/") &&
    url.pathname.toLowerCase().endsWith(".mp3") &&
    response.ok
  ) {
    const musicCache = await caches.open("panastale-musica-v1");

    await musicCache.put(request, response.clone());
  }
}
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

  await cacheMusic(event.request, response);
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
