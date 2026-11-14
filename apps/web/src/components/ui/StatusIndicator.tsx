"use client";

import type { LoadingState } from "@/lib/types";

interface StatusIndicatorProps {
  state: LoadingState;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}
export function StatusIndicator({
  state,
  message,
  retryLabel = "Try Again",
  onRetry,
}: StatusIndicatorProps) {
  if (state === "ready") return null;

  return (
    <div className="status-indicator" role="status" aria-live="polite">
      {state === "loading" && (
        <>
          <div className="status-spinner" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="var(--border)" strokeWidth="3" />
              <path
                d="M16 3a13 13 0 0 1 13 13"
                stroke="var(--forest-mid)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="status-text">{message || "Loading…"}</p>
        </>
      )}
      {state === "error" && (
        <>
          <div className="status-icon status-error" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <p className="status-text">{message || "An error occurred."}</p>
          {onRetry && (
            <button className="btn btn-secondary" onClick={onRetry}>
              {retryLabel}
            </button>
          )}
        </>
      )}
      {state === "empty" && (
        <>
          <div className="status-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M9 9h6M9 13h4" />
            </svg>
          </div>
          <p className="status-text">{message || "No data available."}</p>
        </>
      )}
      {state === "unavailable" && (
        <>
          <div className="status-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <p className="status-text">{message || "Data not yet available."}</p>
        </>
      )}
    </div>
  );
}
