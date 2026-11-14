"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Layers, Ruler } from "lucide-react";
import { evaluateScaleHonesty } from "@/constants/ashanti-pilot";

interface ScaleHonestyBannerProps {
  farmAreaHa: number;
  onChangeFarmArea: (ha: number) => void;
}

export function ScaleHonestyBanner({
  farmAreaHa,
  onChangeFarmArea,
}: ScaleHonestyBannerProps) {
  const t = useTranslations("scale");
  const sliderId = useId();
  const entries = evaluateScaleHonesty(farmAreaHa);
  const farmKm2 = Number((farmAreaHa / 100).toFixed(3));
  const farmsInImerg = Math.max(1, Math.round(100 / Math.max(0.0025, farmAreaHa / 100)));

  return (
    <section className="sf-card" aria-labelledby={`${sliderId}-heading`}>
      <div className="sf-card-header">
        <div>
          <span className="label">{t("label")}</span>
          <h2 id={`${sliderId}-heading`} className="sf-card-title">
            {t("title")}
          </h2>
        </div>
        <div className="sf-farm-slider-box">
          <div className="sf-farm-slider-top">
            <label htmlFor={sliderId} className="sf-control-label">
              <Ruler size={14} aria-hidden="true" />
              <span>{t("farmSizeLabel")}</span>
            </label>
            <strong className="sf-tabular-badge">{farmAreaHa.toFixed(1)} ha</strong>
          </div>
          <input
            id={sliderId}
            type="range"
            min={0.5}
            max={25}
            step={0.5}
            value={farmAreaHa}
            onChange={(e) => onChangeFarmArea(Number(e.target.value))}
            className="slider-input"
          />
        </div>
      </div>

      <p className="sf-callout-info">
        <Layers size={16} aria-hidden="true" className="shrink-0" />
        <span>
          {t("honestyCallout", {
            farmHa: farmAreaHa.toFixed(1),
            farmKm2: farmKm2.toFixed(3),
            farmsCovered: farmsInImerg.toLocaleString(),
          })}
        </span>
      </p>

      <div className="sf-scale-grid">
        {entries.map((item) => {
          const tierLabel =
            item.advisoryTier === "field_scale"
              ? t("fieldScale")
              : item.advisoryTier === "sub_regional"
                ? t("subRegional")
                : t("regionalContext");
          const badgeClass =
            item.advisoryTier === "field_scale"
              ? "tier-established"
              : item.advisoryTier === "sub_regional"
                ? "tier-derived"
                : "tier-hypothesis";

          return (
            <div key={item.dataset} className="sf-scale-item">
              <div className="sf-scale-item-head">
                <span className="sf-scale-ds">{item.dataset}</span>
                <span className={`sf-tier-badge ${badgeClass}`}>{tierLabel}</span>
              </div>
              <div className="sf-scale-meta">
                <span>
                  {item.nativeResolutionKm < 1
                    ? `${Math.round(item.nativeResolutionKm * 1000)} m grid`
                    : `${item.nativeResolutionKm} km grid`}
                </span>
                <span>{item.pixelAreaKm2.toFixed(4)} km² pixel</span>
              </div>
              <p className="sf-scale-note">{item.note}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
