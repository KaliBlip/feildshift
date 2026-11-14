"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Database, Printer } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { AshantiMapExplorer } from "@/components/AshantiMapExplorer";
import { EvidencePassportDialog } from "@/components/EvidencePassportDialog";
import { GlossaryPopoverBar } from "@/components/GlossaryPopoverBar";
import { ScaleHonestyBanner } from "@/components/ScaleHonestyBanner";
import { StrategyComparisonStudio } from "@/components/StrategyComparisonStudio";
import { VulnerabilityCalendar } from "@/components/VulnerabilityCalendar";
import {
  ASHANTI_PILOT_CELLS,
  DEFAULT_FARM_AREA_HA,
} from "@/constants/ashanti-pilot";
import {
  fetchPilotWorkspaceData,
  getOfflineCellPayload,
  type PilotWorkspacePayload,
} from "@/lib/supabase";
import type { EvidencePassport } from "@/types/database";

export default function WorkspacePage() {
  const t = useTranslations("workspace");
  const [selectedCellId, setSelectedCellId] = useState<string>("ASH_R05_C05");
  const [farmAreaHa, setFarmAreaHa] = useState<number>(DEFAULT_FARM_AREA_HA);
  const [payload, setPayload] = useState<PilotWorkspacePayload>(() =>
    getOfflineCellPayload("ASH_R05_C05"),
  );
  const [activePassport, setActivePassport] = useState<EvidencePassport | null>(null);

  const handleSelectCell = (nextCellId: string) => {
    setSelectedCellId(nextCellId);
    setPayload(getOfflineCellPayload(nextCellId));
  };

  useEffect(() => {
    let cancelled = false;
    void fetchPilotWorkspaceData(selectedCellId).then((res) => {
      if (!cancelled) {
        setPayload(res);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCellId]);

  const sourceBadge =
    payload.source === "supabase"
      ? t("sourceSupabase")
      : payload.source === "cache"
        ? t("sourceCache")
        : t("sourceFixture");

  return (
    <>
      <AppNav />
      <main className="sf-page-main">
        <div className="container sf-page-stack">
          {/* Page Header */}
          <header className="sf-page-header">
            <div>
              <div className="sf-header-meta">
                <span className="label">{t("badge")}</span>
                <span className="sf-chip">
                  <Database size={12} aria-hidden="true" />
                  <span>{sourceBadge}</span>
                </span>
              </div>
              <h1 className="display-md sf-page-title">{t("title")}</h1>
              <p className="sf-page-subtitle">{t("subtitle")}</p>
            </div>

            <div className="sf-header-actions sf-no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary btn-sm"
              >
                <Printer size={15} aria-hidden="true" />
                <span>{t("printSummary")}</span>
              </button>
            </div>
          </header>

          {/* Scale Honesty Check */}
          <ScaleHonestyBanner farmAreaHa={farmAreaHa} onChangeFarmArea={setFarmAreaHa} />

          {/* Interactive Map Explorer */}
          <AshantiMapExplorer
            selectedCellId={selectedCellId}
            onSelectCell={handleSelectCell}
            cells={ASHANTI_PILOT_CELLS}
          />

          {/* Seasonal Vulnerability & Bare-Field Calendar */}
          <VulnerabilityCalendar />

          {/* Strategy Comparison, Monte Carlo & Climate Stress-Test Studio */}
          <StrategyComparisonStudio
            cellId={selectedCellId}
            farmAreaHa={farmAreaHa}
            strategies={payload.strategies}
            passports={payload.passports}
            onOpenPassport={setActivePassport}
          />

          {/* Plain-Language Glossary */}
          <GlossaryPopoverBar />
        </div>
      </main>

      <EvidencePassportDialog
        passport={activePassport}
        onClose={() => setActivePassport(null)}
      />
    </>
  );
}
