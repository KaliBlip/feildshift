import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  authenticateWithPhonePin,
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
  type AuthSession,
} from '@/lib/auth';

interface AuthContextValue {
  session: AuthSession | null;
  isHydrating: boolean;
  signIn: (
    phone: string,
    pin: string,
  ) => Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let active = true;
    void loadStoredSession().then((stored) => {
      if (active) {
        setSession(stored);
        setIsHydrating(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (phone: string, pin: string) => {
    const res = authenticateWithPhonePin(phone, pin);
    if (res.ok) {
      setSession(res.session);
      await saveStoredSession(res.session);
    }
    return res;
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    await clearStoredSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isHydrating,
      signIn,
      signOut,
    }),
    [isHydrating, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
