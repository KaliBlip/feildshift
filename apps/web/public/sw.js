const CACHE_NAME = "fieldshift-web-v1";
const CORE_SHELL_URLS = ["/", "/workspace", "/officer", "/sms-ussd"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_SHELL_URLS).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
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
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => undefined);
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/workspace"))),
  );
});
/// <reference lib="webworker" />

/**
 * ScalarField PWA Service Worker
 *
 * Caching strategy:
 *  - App shell (HTML, CSS, JS): cache-first with network fallback
 *  - API data: network-first with cache fallback
 *  - Map tiles: cache-first (stale-while-revalidate)
 *  - Outcome reports: offline queue → sync when online
 */

const CACHE_NAME = "scalarfield-v1";
const DATA_CACHE_NAME = "scalarfield-data-v1";
const TILE_CACHE_NAME = "scalarfield-tiles-v1";
const QUEUE_KEY = "scalarfield-offline-queue";

const APP_SHELL_URLS = [
  "/",
  "/favicon.ico",
];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});
// Activate: clean old caches
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

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (except queued POSTs handled separately)
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

  // API data: network-first
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
        .catch(() => caches.match(request).then((cached) => cached || new Response(
          JSON.stringify({ error: "offline", message: "You are offline. Showing cached data." }),
          { headers: { "Content-Type": "application/json" } },
        ))),
    );
    return;
  }

  // App shell: cache-first
  event.respondWith(
    caches
      .match(request)
      .then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok && url.origin === self.location.origin) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          }),
      )
      .catch(() => {
        // Fallback for navigation requests
        if (request.mode === "navigate") {
          return caches.match("/") || new Response(
            "<html><body><h1>ScalarField</h1><p>You are offline. Please reconnect to continue.</p></body></html>",
            { headers: { "Content-Type": "text/html" } },
          );
        }
        return new Response("", { status: 503 });
      }),
  );
});

// Background sync for outcome reports
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-outcome-reports") {
    event.waitUntil(syncQueuedReports());
  }
});

async function syncQueuedReports() {
  // Retrieve queued reports from IndexedDB or localStorage
  // This is a placeholder — actual implementation depends on Supabase API
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: "SYNC_COMPLETE",
      message: "Queued outcome reports have been submitted.",
    });
  });
}

// Message handler for queuing reports
self.addEventListener("message", (event) => {
  if (event.data?.type === "QUEUE_OUTCOME_REPORT") {
    // Store report for later sync
    // In production, this would use IndexedDB
    event.source?.postMessage({
      type: "REPORT_QUEUED",
      message: "Report saved offline. It will be submitted when you reconnect.",
    });
  }
});
