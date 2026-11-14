import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { INITIAL_OUTCOME_REPORTS } from "@/constants/ashanti-pilot";
import { computeM8CalibrationPreview } from "@/lib/m8-calibration";
import type { EvidenceGrade, OutcomeReportRecord } from "@/types/database";

const OFFICER_ROLES = new Set(["extension_officer", "agronomist"]);
const VALID_GRADES = new Set<EvidenceGrade>([
  "farmer_reported",
  "officer_reviewed",
  "expert_validated",
  "confounded_excluded",
]);

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

/**
 * Verify extension-officer / agronomist role from Supabase JWT when present,
 * or accept explicit demo session role header only when Supabase Auth is not used.
 */
async function resolveVerifiedRole(request: Request, fallbackRole: string): Promise<{
  role: string;
  actorId: string;
  verifiedViaJwt: boolean;
}> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (token) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (url && anonKey) {
      const authClient = createClient(url, anonKey);
      const { data, error } = await authClient.auth.getUser(token);
      if (!error && data.user) {
        const jwtRole = String(data.user.app_metadata?.role ?? "farmer");
        return { role: jwtRole, actorId: data.user.id, verifiedViaJwt: true };
      }
      return { role: "farmer", actorId: "invalid-token", verifiedViaJwt: true };
    }
  }

  return {
    role: fallbackRole || "farmer",
    actorId: `demo-${fallbackRole || "farmer"}`,
    verifiedViaJwt: false,
  };
}

export async function GET() {
  const sb = getServerSupabase();
  let reports: OutcomeReportRecord[] = INITIAL_OUTCOME_REPORTS;
  let source: "supabase" | "fixture" = "fixture";

  if (sb) {
    const { data, error } = await sb
      .from("outcome_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (!error && Array.isArray(data) && data.length > 0) {
      reports = data as OutcomeReportRecord[];
      source = "supabase";
    }
  }

  return NextResponse.json({
    ok: true,
    source,
    reports,
    calibration: computeM8CalibrationPreview(reports),
  });
}

interface ReviewPostBody {
  outcomeId?: string;
  evidenceGrade?: EvidenceGrade;
  eligibleForModelUpdate?: boolean;
  demoRole?: string;
  reportsSnapshot?: OutcomeReportRecord[];
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ReviewPostBody;
  const auth = await resolveVerifiedRole(request, String(body.demoRole ?? "farmer"));

  if (!OFFICER_ROLES.has(auth.role)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Forbidden: outcome grading and M8 calibration approval require extension_officer or agronomist role.",
        role: auth.role,
        verifiedViaJwt: auth.verifiedViaJwt,
      },
      { status: 403 },
    );
  }

  const outcomeId = String(body.outcomeId ?? "").trim();
  const grade = body.evidenceGrade;
  if (!outcomeId || !grade || !VALID_GRADES.has(grade)) {
    return NextResponse.json(
      { ok: false, error: "Valid outcomeId and evidenceGrade are required." },
      { status: 400 },
    );
  }

  const eligible =
    grade === "confounded_excluded" || grade === "farmer_reported"
      ? false
      : Boolean(body.eligibleForModelUpdate);
  const reviewedAt = new Date().toISOString();

  let persistedToSupabase = false;
  const sb = getServerSupabase();
  if (sb && !outcomeId.startsWith("out-demo-") && !outcomeId.startsWith("out-17")) {
    const { error } = await sb
      .from("outcome_reports")
      .update({
        evidence_grade: grade,
        eligible_for_model_update: eligible,
        reviewed_at: reviewedAt,
      })
      .eq("outcome_id", outcomeId);
    persistedToSupabase = !error;
  }

  const baseList = Array.isArray(body.reportsSnapshot)
    ? body.reportsSnapshot
    : INITIAL_OUTCOME_REPORTS;
  const updatedList = baseList.map((item) =>
    item.outcome_id === outcomeId
      ? {
          ...item,
          evidence_grade: grade,
          eligible_for_model_update: eligible,
          graded_by_officer_id: auth.actorId,
          reviewed_at: reviewedAt,
        }
      : item,
  );

  return NextResponse.json({
    ok: true,
    outcomeId,
    evidenceGrade: grade,
    eligibleForModelUpdate: eligible,
    persistedToSupabase,
    verifiedViaJwt: auth.verifiedViaJwt,
    calibration: computeM8CalibrationPreview(updatedList),
  });
}
