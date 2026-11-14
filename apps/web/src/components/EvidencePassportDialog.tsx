"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeCheck, Database, Radar, X } from "lucide-react";
import type { EvidencePassport } from "@/types/database";

interface EvidencePassportDialogProps {
  passport: EvidencePassport | null;
  onClose: () => void;
}

const TIER_META: Record<
  EvidencePassport["evidenceTier"],
  { label: string; className: string }
> = {
  established_science: { label: "Established Science", className: "tier-established" },
  data_derived_finding: { label: "Data-Derived Finding", className: "tier-derived" },
  expert_validated_insight: { label: "Expert Validated", className: "tier-validated" },
  farmer_reported_observation: { label: "Farmer Observation", className: "tier-farmer" },
  unverified_hypothesis: { label: "Unverified Hypothesis", className: "tier-hypothesis" },
};

export function EvidencePassportDialog({
  passport,
  onClose,
}: EvidencePassportDialogProps) {
  const t = useTranslations("passport");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (passport) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [passport]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const handleClose = () => {
      // Clear stale returnValue across browsers before delegating close
      dialog.returnValue = "";
      onClose();
    };
    dialog.addEventListener("close", handleClose);

    // Fallback light-dismiss only when closedby="any" is unsupported in this browser
    let cleanupPointer = () => undefined;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const rect = dialog.getBoundingClientRect();
        return (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
      };
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          dialog.close("backdrop");
        }
      };
      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
      cleanupPointer = () => {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      cleanupPointer();
    };
  }, [onClose]);

  const tierInfo = passport ? TIER_META[passport.evidenceTier] : null;

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-labelledby={titleId}
      className="sf-passport-dialog"
    >
      {passport && tierInfo && (
        <div className="sf-passport-dialog-body">
          <header className="sf-passport-header">
            <div>
              <span className={`sf-tier-badge ${tierInfo.className}`}>
                {passport.evidenceTier === "established_science" ||
                passport.evidenceTier === "expert_validated_insight" ? (
                  <BadgeCheck size={14} aria-hidden="true" />
                ) : passport.evidenceTier === "data_derived_finding" ? (
                  <Radar size={14} aria-hidden="true" />
                ) : (
                  <AlertTriangle size={14} aria-hidden="true" />
                )}
                <span>{tierInfo.label}</span>
              </span>
              <h2 id={titleId} className="sf-passport-title">
                {passport.title}
              </h2>
              <p className="sf-passport-sub">
                Cell <code>{passport.cellId}</code> · Strategy <code>{passport.strategyCode}</code>
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close("button")}
              className="sf-icon-close-btn"
              aria-label={t("dialogClose")}
              autoFocus
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="sf-passport-grid">
            <section className="sf-passport-block">
              <h3>{t("datasets")}</h3>
              <div className="sf-pill-list">
                {passport.datasetsUsed.map((ds) => (
                  <span key={ds} className="sf-chip">
                    <Database size={12} aria-hidden="true" />
                    <span>{ds}</span>
                  </span>
                ))}
              </div>
              <p className="sf-meta-line">
                <strong>{t("coverage")}:</strong> {passport.spatialTemporalCoverage}
              </p>
            </section>

            <section className="sf-passport-block">
              <h3>{t("method")}</h3>
              <p>{passport.methodApplied}</p>
              <p className="sf-meta-line">{passport.observationSummary}</p>
            </section>

            <section className="sf-passport-block sf-passport-highlight">
              <h3>{t("scaleNote")}</h3>
              <p>{passport.scaleHonestyNote}</p>
              <p className="sf-meta-line">
                <strong>{t("uncertainty")}:</strong> {passport.uncertaintySummary}
              </p>
            </section>

            <section className="sf-passport-block">
              <h3>{t("gaps")}</h3>
              <ul className="sf-bullet-list">
                {passport.informationGaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
              <h3 className="mt-4">{t("localReview")}</h3>
              <ul className="sf-bullet-list">
                {passport.requiredLocalReview.map((rev) => (
                  <li key={rev}>{rev}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </dialog>
  );
}
