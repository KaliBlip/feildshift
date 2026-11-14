"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";

function subscribeToConnectivity(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

function getServerOnlineSnapshot(): boolean {
  return true;
}

/* ─── Service Worker Registration ────────────────────────────────────── */

export function usePWA() {
  const isOnline = useSyncExternalStore(
    subscribeToConnectivity,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );
  const [swRegistered, setSwRegistered] = useState(false);
  const [queuedReports, setQueuedReports] = useState(0);

  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        setQueuedReports(0);
      }
      if (event.data?.type === "REPORT_QUEUED") {
        setQueuedReports((queued) => queued + 1);
      }
    };

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => setSwRegistered(true))
        .catch((err) => console.warn("SW registration failed:", err));

      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    return () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, []);

  const queueOutcomeReport = useCallback(
    (report: Record<string, unknown>) => {
      if (!navigator.serviceWorker?.controller) {
        console.warn("Service worker not available for offline queuing");
        return false;
      }

      // Save to localStorage as fallback
      const existing = JSON.parse(
        localStorage.getItem("scalarfield-queued-reports") || "[]",
      );
      existing.push({ ...report, queuedAt: new Date().toISOString() });
      localStorage.setItem(
        "scalarfield-queued-reports",
        JSON.stringify(existing),
      );

      // Notify service worker
      navigator.serviceWorker.controller.postMessage({
        type: "QUEUE_OUTCOME_REPORT",
        report,
      });

      setQueuedReports((q) => q + 1);

      // Request background sync if available
      if ("sync" in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((reg) => {
          (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
            .sync.register("sync-outcome-reports");
        });
      }

      return true;
    },
    [],
  );

  return { isOnline, swRegistered, queuedReports, queueOutcomeReport };
}

/* ─── Offline Banner ─────────────────────────────────────────────────── */

export function OfflineBanner() {
  const { isOnline, queuedReports } = usePWA();

  if (isOnline && queuedReports === 0) return null;

  return (
    <div
      className="offline-banner"
      role="status"
      aria-live="polite"
      data-offline={!isOnline}
    >
      {!isOnline && (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          <span>You are offline. Cached data is being shown.</span>
        </>
      )}
      {queuedReports > 0 && (
        <span className="queued-badge">
          {queuedReports} report{queuedReports !== 1 ? "s" : ""} queued for sync
        </span>
      )}
    </div>
  );
}

/* ─── PWA Meta Tags ──────────────────────────────────────────────────── */

export function PWAHead() {
  return (
    <>
      <meta name="application-name" content="ScalarField" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="ScalarField" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#1a3d28" />
      <link rel="manifest" href="/manifest.json" />
    </>
  );
}
