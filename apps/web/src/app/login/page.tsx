"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Phone, ShieldCheck } from "lucide-react";

import {
  authenticateWithPhonePin,
  DEMO_ACCOUNTS,
  saveWebSession,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("0512345601");
  const [pin, setPin] = useState("1111");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = authenticateWithPhonePin(phone, pin);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    saveWebSession(res.session);
    if (res.session.role === "farmer") {
      router.push("/");
    } else {
      router.push("/officer");
    }
  };

  return (
    <main className="mx-auto flex min-h-[82vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          FIELD SHIFT · ASHANTI PILOT
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Sign in with Phone &amp; PIN
        </h1>
        <p className="text-sm text-neutral-600">
          Challenge role access for Farmers, MoFA Extension Officers, and
          CSIR-CRI Agronomists.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-600">
            <Phone className="h-3.5 w-3.5" />
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError(null);
            }}
            placeholder="0512345601"
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-600">
            <Lock className="h-3.5 w-3.5" />
            4-Digit PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError(null);
            }}
            placeholder="••••"
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm tracking-widest outline-none focus:border-blue-600"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Sign In
        </button>
      </form>

      <div className="mt-5 space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Challenge Demo Credentials (Click to fill)
        </p>
        <div className="space-y-1.5">
          {DEMO_ACCOUNTS.map((acct) => {
            const active = phone === acct.phone && pin === acct.pin;
            return (
              <button
                key={acct.id}
                type="button"
                onClick={() => {
                  setPhone(acct.phone);
                  setPin(acct.pin);
                  setError(null);
                }}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
                }`}
              >
                <span className="font-semibold">
                  {acct.role === "farmer"
                    ? "Farmer"
                    : acct.role === "extension_officer"
                      ? "Extension Officer"
                      : "Agronomist"}{" "}
                  · {acct.displayName}
                </span>
                <span className="font-mono text-[11px] text-neutral-500">
                  {acct.phone} / {acct.pin}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-xs text-neutral-500 hover:underline">
          Back to Ashanti Explorer
        </Link>
      </div>
    </main>
  );
}
