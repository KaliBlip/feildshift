import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'farmer' | 'extension_officer' | 'agronomist';

export interface AuthAccount {
  id: string;
  phone: string;
  pin: string;
  role: UserRole;
  displayName: string;
  organization: string;
}

export interface AuthSession {
  id: string;
  phone: string;
  role: UserRole;
  displayName: string;
  organization: string;
  signedInAt: string;
}

export const DEMO_ACCOUNTS: readonly AuthAccount[] = [
  {
    id: 'demo-farmer-01',
    phone: '0512345601',
    pin: '1111',
    role: 'farmer',
    displayName: 'Kwame Boateng',
    organization: 'Ashanti Smallholder Plot',
  },
  {
    id: 'demo-officer-02',
    phone: '0512345602',
    pin: '2222',
    role: 'extension_officer',
    displayName: 'Abena Mensah',
    organization: 'MoFA Extension Officer',
  },
  {
    id: 'demo-agronomist-03',
    phone: '0512345603',
    pin: '3333',
    role: 'agronomist',
    displayName: 'Dr. Kofi Owusu',
    organization: 'CSIR-CRI Agronomist',
  },
];

const SESSION_STORAGE_KEY = 'fieldshift.auth.session.v1';

export function normalizePhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('233') && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

export function authenticateWithPhonePin(
  phoneRaw: string,
  pinRaw: string,
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const phone = normalizePhoneInput(phoneRaw);
  const pin = pinRaw.trim();

  if (phone.length < 10) {
    return { ok: false, error: 'Enter a valid 10-digit phone number (e.g. 0512345601).' };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: 'Enter your 4-digit PIN.' };
  }

  const match = DEMO_ACCOUNTS.find((acct) => acct.phone === phone && acct.pin === pin);
  if (!match) {
    return {
      ok: false,
      error: 'Invalid phone number or 4-digit PIN.',
    };
  }

  return {
    ok: true,
    session: {
      id: match.id,
      phone: match.phone,
      role: match.role,
      displayName: match.displayName,
      organization: match.organization,
      signedInAt: new Date().toISOString(),
    },
  };
}

export async function loadStoredSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.phone || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveStoredSession(session: AuthSession): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage failures cleanly
  }
}

export async function clearStoredSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures cleanly
  }
}
