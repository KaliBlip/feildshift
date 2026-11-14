"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/i18n/messages/en.json";
import twMessages from "@/i18n/messages/tw.json";
import {
  flushPendingOfflineQueue,
  getPendingQueueCount,
} from "@/lib/supabase";

export type AppLocale = "en" | "tw";

const ALL_MESSAGES = {
  en: enMessages,
  tw: twMessages,
} as const;

interface AppShellContextValue {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  isOnline: boolean;
  pendingCount: number;
  refreshPendingCount: () => void;
  syncQueueNow: () => Promise<void>;
}

const AppShellContext = createContext<AppShellContextValue>({
  locale: "en",
  setLocale: () => undefined,
  isOnline: true,
  pendingCount: 0,
  refreshPendingCount: () => undefined,
  syncQueueNow: async () => undefined,
});

export function useAppShell() {
  return useContext(AppShellContext);
}

const LOCALE_KEY = "fieldshift.web.locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getPendingQueueCount());
  }, []);

  const syncQueueNow = useCallback(async () => {
    const res = await flushPendingOfflineQueue();
    setPendingCount(res.remaining);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    void Promise.resolve().then(() => {
      try {
        const saved = window.localStorage.getItem(LOCALE_KEY);
        if (saved === "tw" || saved === "en") {
          setLocaleState(saved);
          document.documentElement.lang = saved;
        }
      } catch {
        // Ignore storage access errors
      }
      setIsOnline(navigator.onLine);
      refreshPendingCount();
    });

    const handleOnline = () => {
      setIsOnline(true);
      void syncQueueNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshPendingCount, syncQueueNow]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
      document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOCALE_KEY, next);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      isOnline,
      pendingCount,
      refreshPendingCount,
      syncQueueNow,
    }),
    [locale, setLocale, isOnline, pendingCount, refreshPendingCount, syncQueueNow],
  );

  return (
    <AppShellContext.Provider value={value}>
      <NextIntlClientProvider
        locale={locale}
        messages={ALL_MESSAGES[locale]}
        timeZone="Africa/Accra"
      >
        {children}
      </NextIntlClientProvider>
    </AppShellContext.Provider>
  );
}
