/// <reference lib="webworker" />

const CACHE_NAME = "fieldshift-web-v1";
const DATA_CACHE_NAME = "fieldshift-data-v1";
const TILE_CACHE_NAME = "fieldshift-tiles-v1";

const APP_SHELL_URLS = [
  "/",
  "/workspace",
  "/officer",
  "/sms-ussd",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k !== CACHE_NAME &&
                k !== DATA_CACHE_NAME &&
                k !== TILE_CACHE_NAME,
            )
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // Map tiles: cache-first
  if (
    url.hostname.includes("tile") ||
    url.hostname.includes("maplibre") ||
    url.pathname.includes("/tiles/")
  ) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            }),
        ),
      ),
    );
    return;
  }

  // API & Supabase data: network-first with cache fallback
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DATA_CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              new Response(
                JSON.stringify({
                  error: "offline",
                  message: "You are offline. Showing cached data.",
                }),
                { headers: { "Content-Type": "application/json" } },
              ),
          ),
        ),
    );
    return;
  }

  // App shell: network-first for same-origin navigation, cache-first for static assets
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") {
            return caches.match("/workspace").then((ws) => ws || caches.match("/"));
          }
          return new Response("", { status: 503 });
        }),
      ),
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-outcome-reports") {
    event.waitUntil(syncQueuedReports());
  }
});

async function syncQueuedReports() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: "SYNC_COMPLETE",
      message: "Queued outcome reports have been submitted.",
    });
  });
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "QUEUE_OUTCOME_REPORT") {
    event.source?.postMessage({
      type: "REPORT_QUEUED",
      message: "Report saved offline. It will be submitted when you reconnect.",
    });
  }
});
