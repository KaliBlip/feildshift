"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export interface SegmentedOption {
  id: string;
  label: string;
}

export function SegmentedPillBar({
  options,
  selectedId,
  onSelect,
}: {
  options: readonly SegmentedOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex w-full flex-wrap items-center gap-1 rounded-full bg-[#EFEFEF] p-1"
    >
      {options.map((opt) => {
        const active = opt.id === selectedId;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(opt.id)}
            className={`flex-1 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
              active
                ? "bg-white text-[#171717] shadow-sm"
                : "text-[#52525B] hover:text-[#171717]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ThreeZoneGaugeBar({
  valuePct,
  leftLabel = "Low fit",
  centerLabel = "Optimal",
  rightLabel = "Robust",
}: {
  valuePct: number;
  leftLabel?: string;
  centerLabel?: string;
  rightLabel?: string;
}) {
  const clamped = Math.max(4, Math.min(96, Math.round(valuePct)));

  return (
    <div className="space-y-1.5">
      <div className="relative flex h-2.5 w-full overflow-visible rounded-full bg-[#EFEFEF]">
        <div className="h-full w-[35%] rounded-l-full bg-[#F9D601]" />
        <div className="h-full w-[40%] bg-[#3670FF]" />
        <div className="h-full w-[25%] rounded-r-full bg-[#1FB26B]" />
        <div
          style={{ left: `${clamped}%` }}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#3670FF] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
        >
          {Math.round(valuePct)}%
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] font-medium text-[#52525B]">
        <span>{leftLabel}</span>
        <span>{centerLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export function SmartInsightCard({
  firstLabel,
  secondLabel,
  firstIcon,
  secondIcon,
}: {
  firstLabel: string;
  secondLabel: string;
  firstIcon?: ReactNode;
  secondIcon?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#3670FF] bg-[#EBF1FF] px-3.5 py-2.5 text-xs font-semibold text-[#1E4CE0]">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-xs">
        {firstIcon}
        <span>{firstLabel}</span>
      </span>
      <ArrowRight size={14} className="text-[#3670FF]" aria-hidden="true" />
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF7EF] px-3 py-1 text-[#166534] shadow-xs">
        {secondIcon}
        <span>{secondLabel}</span>
      </span>
    </div>
  );
}

export function RoofiBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "blue" | "gold" | "green" | "neutral";
}) {
  const toneClasses = {
    blue: "bg-[#EBF1FF] text-[#1E4CE0]",
    gold: "bg-[#FFF9D6] text-[#7A6200]",
    green: "bg-[#EAF7EF] text-[#166534]",
    neutral: "bg-[#EFEFEF] text-[#171717]",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${toneClasses}`}
    >
      {children}
    </span>
  );
}
