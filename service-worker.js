
const CACHE_NAME = "panastale-v3";

// Archivos esenciales y recursos del juego
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",

  // Héroes
  "./Sprites/Heroes/Jose.png",
  "./Sprites/Heroes/Ivan.png",
  "./Sprites/Heroes/Paulo.png",
  "./Sprites/Heroes/Gabriel.png",
  "./Sprites/Heroes/Boomer.png",

  // Almas
  "./Sprites/ALMAS/soul_Jose.png",
  "./Sprites/ALMAS/soul_Ivan.png",
  "./Sprites/ALMAS/soul_Paulo.png",
  "./Sprites/ALMAS/soul_Gabriel.png",
  "./Sprites/ALMAS/soul_Boomer.png",

  // Enemigos
  "./Sprites/Enemigos/CuadradoMalvado.png",
  "./Sprites/Enemigos/SlimeOscuro.png",
  "./Sprites/Enemigos/guardian_fase1.png",
  "./Sprites/Enemigos/guardian_fase2.png",
  "./Sprites/Enemigos/guardian_fase3.png",

  // Proyectiles
  "./Sprites/Proyectiles/Proyectil_CM.png",
  "./Sprites/Proyectiles/Proyectil_SO.png",
  "./Sprites/Proyectiles/Proyectil_Guardian.png",

  // Música
  "./Music/Menu.mp3",
  "./Music/Batalla_Comun.mp3",
  "./Music/Guardian_Jefe.mp3"
];

// INSTALACIÓN Y DESCARGA INICIAL
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.all(
        FILES_TO_CACHE.map(async file => {
          try {
            await cache.add(file);
          } catch (error) {
            console.warn("No se pudo guardar:", file, error);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

// ACTIVACIÓN
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith("panastale-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

// CACHÉ AUTOMÁTICA DE RECURSOS
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Solo guardar recursos del propio PANASTALE
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      const cached = await cache.match(request);

      if (cached) return cached;

      try {
        const response = await fetch(request);

        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
        }

        return response;

      } catch (error) {
        // Si no hay internet, intentar abrir la página guardada
        if (request.mode === "navigate") {
          const offlinePage = await cache.match("./index.html");

          if (offlinePage) return offlinePage;
        }

        throw error;
      }
    })()
  );
});
