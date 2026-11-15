import type { UserRole } from "@/types/database";

export interface WebDemoAccount {
  id: string;
  phone: string;
  pin: string;
  role: UserRole;
  displayName: string;
  organization: string;
}

export interface WebAuthSession {
  id: string;
  phone: string;
  role: UserRole;
  displayName: string;
  organization: string;
  signedInAt: string;
}

export const DEMO_ACCOUNTS: readonly WebDemoAccount[] = [
  {
    id: "demo-farmer-01",
    phone: "0512345601",
    pin: "1111",
    role: "farmer",
    displayName: "Kwame Boateng",
    organization: "Ashanti Smallholder Plot",
  },
  {
    id: "demo-officer-02",
    phone: "0512345602",
    pin: "2222",
    role: "extension_officer",
    displayName: "Abena Mensah",
    organization: "MoFA Extension Officer",
  },
  {
    id: "demo-agronomist-03",
    phone: "0512345603",
    pin: "3333",
    role: "agronomist",
    displayName: "Dr. Kofi Owusu",
    organization: "CSIR-CRI Agronomist",
  },
];

const WEB_SESSION_KEY = "fieldshift.web.auth.v1";

export function normalizePhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  return digits;
}

export function authenticateWithPhonePin(
  phoneRaw: string,
  pinRaw: string,
): { ok: true; session: WebAuthSession } | { ok: false; error: string } {
  const phone = normalizePhoneInput(phoneRaw);
  const pin = pinRaw.trim();

  if (phone.length < 10) {
    return { ok: false, error: "Enter a valid 10-digit phone number (e.g. 0512345601)." };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: "Enter your 4-digit PIN." };
  }

  const match = DEMO_ACCOUNTS.find((acct) => acct.phone === phone && acct.pin === pin);
  if (!match) {
    return { ok: false, error: "Invalid phone number or 4-digit PIN." };
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

export function loadWebSession(): WebAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WEB_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WebAuthSession;
    return parsed?.phone && parsed?.role ? parsed : null;
  } catch {
    return null;
  }
}

export function saveWebSession(session: WebAuthSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WEB_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors cleanly
  }
}

export function clearWebSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WEB_SESSION_KEY);
  } catch {
    // Ignore storage errors cleanly
  }
}
