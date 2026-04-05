const CACHE_VERSION = "v4";
const STATIC_CACHE_NAME = `holdem-quiz-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `holdem-quiz-runtime-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-maskable.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/cards/back.svg",
  "/privacy",
  "/support",
];

const putIfSuccessful = async (cacheName, request, response) => {
  if (!response || !response.ok) {
    return response;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
};

const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  return putIfSuccessful(RUNTIME_CACHE_NAME, request, response);
};

const networkFirst = async (request) => {
  try {
    const response = await fetch(request);
    return await putIfSuccessful(RUNTIME_CACHE_NAME, request, response);
  } catch {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
};

const handleNavigation = async (request) => {
  try {
    const response = await fetch(request);
    return await putIfSuccessful(RUNTIME_CACHE_NAME, request, response);
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const home = await caches.match("/");
    return home || Response.error();
  }
};

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE_NAME && key !== RUNTIME_CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigation(event.request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "font" ||
    event.request.destination === "image"
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
