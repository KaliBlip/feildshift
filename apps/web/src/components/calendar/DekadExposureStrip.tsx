"use client";

import { useMemo, useState } from "react";
import { CloudRain, Flame, Sprout } from "lucide-react";
import type { DekadWindowSummary } from "@/types/database";

const FULL_MONTH_NAMES: Record<string, string> = {
  jan: "January",
  feb: "February",
  mar: "March",
  apr: "April",
  may: "May",
  jun: "June",
  jul: "July",
  aug: "August",
  sep: "September",
  oct: "October",
  nov: "November",
  dec: "December",
};

interface StripDekad {
  dekadIndex: number;
  code: string;
  numLabel: string;
  daySpan: string;
  window: DekadWindowSummary;
  isCloudGap: boolean;
}

export function DekadExposureStrip({
  windows,
  onSelectMonthId,
}: {
  windows: DekadWindowSummary[];
  onSelectMonthId?: (monthId: string) => void;
}) {
  const dekads = useMemo<StripDekad[]>(() => {
    const items: StripDekad[] = [];
    windows.forEach((win, monthIdx) => {
      for (let d = 0; d < 3; d++) {
        const dekadIndex = monthIdx * 3 + d + 1;
        items.push({
          dekadIndex,
          code: `D${String(dekadIndex).padStart(2, "0")}`,
          numLabel: String(dekadIndex).padStart(2, "0"),
          daySpan: d === 0 ? "Days 1–10" : d === 1 ? "Days 11–20" : "Days 21–End",
          window: win,
          isCloudGap: win.qaTier === "low_cloud_gap" && d === 1,
        });
      }
    });
    return items;
  }, [windows]);

  const [selectedDekadIndex, setSelectedDekadIndex] = useState<number>(7);
  const selectedDekad =
    dekads.find((item) => item.dekadIndex === selectedDekadIndex) ?? dekads[0];

  const activeMonthName =
    FULL_MONTH_NAMES[selectedDekad?.window.monthLabel.toLowerCase() ?? ""] ??
    selectedDekad?.window.monthLabel ??
    "January";

  return (
    <div className="rounded-[24px] border border-[#E2E4E9] bg-white p-5 shadow-[0_6px_14px_rgba(17,24,39,0.06)]">
      {/* Autis Planner Calendar Header Row */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-[#52525B] uppercase">
            36-DEKAD EXPOSURE CALENDAR
          </p>
          <p className="font-display text-2xl font-bold tracking-tight text-[#171717]">
            {selectedDekad?.window.monthLabel.toUpperCase() ?? "JAN"}
          </p>
        </div>

        <span className="rounded-full bg-[#EBF1FF] px-3.5 py-1.5 text-xs font-semibold text-[#1E4CE0]">
          {activeMonthName} · {selectedDekad?.daySpan ?? "Days 1–10"}
        </span>
      </div>

      {/* Horizontal Scrollable 36-Dekad Circle Strip */}
      <div className="flex gap-2.5 overflow-x-auto pb-2">
        {dekads.map((item) => {
          const isSelected = item.dekadIndex === selectedDekad?.dekadIndex;
          const isBare = item.window.bareFieldRisk;
          const isCloud = item.isCloudGap;

          const ringColor = isSelected
            ? "#3670FF"
            : isBare
              ? "#F9D601"
              : isCloud
                ? "#3670FF"
                : "#1FB26B";

          const dotColor = isBare ? "#7A6200" : isCloud ? "#3670FF" : "#1FB26B";

          const textColor = isSelected
            ? "#FFFFFF"
            : isBare
              ? "#7A6200"
              : isCloud
                ? "#1E4CE0"
                : "#166534";

          return (
            <button
              key={item.dekadIndex}
              type="button"
              onClick={() => {
                setSelectedDekadIndex(item.dekadIndex);
                onSelectMonthId?.(item.window.id);
              }}
              aria-label={`${item.code} ${item.window.monthLabel} ${item.daySpan}`}
              className="flex shrink-0 flex-col items-center gap-1.5 transition-transform hover:scale-105"
            >
              <span
                className={`text-[11px] ${
                  isSelected ? "font-bold text-[#171717]" : "font-medium text-[#52525B]"
                }`}
              >
                {item.window.monthLabel}
              </span>
              <span
                style={{
                  backgroundColor: isSelected ? "#3670FF" : "transparent",
                  borderColor: ringColor,
                  color: textColor,
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors"
              >
                {item.numLabel}
              </span>
              <span
                style={{ backgroundColor: dotColor }}
                className="h-1.5 w-3 rounded-full"
              />
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-[#52525B]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1FB26B]" />
          Cover OK
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7A6200]" />
          Bare risk
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3670FF]" />
          Cloud QA
        </span>
      </div>

      {/* Selected Dekad Detail Card */}
      {selectedDekad && (
        <div className="mt-4 rounded-2xl border border-[#E2E4E9] bg-[#EFEFEF] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#171717]">
              {selectedDekad.window.bareFieldRisk ? (
                <Flame size={16} className="text-[#7A6200]" aria-hidden="true" />
              ) : selectedDekad.isCloudGap ? (
                <CloudRain size={16} className="text-[#3670FF]" aria-hidden="true" />
              ) : (
                <Sprout size={16} className="text-[#166534]" aria-hidden="true" />
              )}
              <span>
                {selectedDekad.code} · {selectedDekad.window.seasonLabel}
              </span>
            </div>
            <span className="font-mono text-xs font-semibold text-[#166534]">
              NDVI {selectedDekad.window.ndviSmooth.toFixed(2)} ·{" "}
              {selectedDekad.window.rainMm} mm
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#52525B]">
            {selectedDekad.window.summaryNote}
          </p>
        </div>
      )}
    </div>
  );
}
