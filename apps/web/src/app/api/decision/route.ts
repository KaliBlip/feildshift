import { NextRequest, NextResponse } from "next/server";

/**
 * Runtime server-to-service bridge from the `web` (Next.js) service to the
 * `api` (FastAPI) decision service via Vercel's `DECISION_API_URL` binding.
 */
function resolveDecisionServiceUrl(pathname: string): URL | null {
  const baseUrl = process.env.DECISION_API_URL;
  if (!baseUrl) return null;
  return new URL(pathname, baseUrl);
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") ?? "analogs";
  const targetPath = action === "health" ? "/api/health" : "/api/analogs";
  const url = resolveDecisionServiceUrl(targetPath);

  if (!url) {
    return NextResponse.json(
      {
        status: "fallback",
        message: "DECISION_API_URL service binding is not set in this environment.",
      },
      { status: 503 },
    );
  }

  const upstream = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const payload = await upstream.json();
  return NextResponse.json(payload, { status: upstream.status });
}

export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") ?? "stress-test";
  const targetPath = action === "score" ? "/api/score" : "/api/stress-test";
  const url = resolveDecisionServiceUrl(targetPath);

  if (!url) {
    return NextResponse.json(
      {
        status: "fallback",
        message: "DECISION_API_URL service binding is not set in this environment.",
      },
      { status: 503 },
    );
  }

  const body = await request.text();
  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });
  const payload = await upstream.json();
  return NextResponse.json(payload, { status: upstream.status });
}
