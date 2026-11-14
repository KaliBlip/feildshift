"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Info } from "lucide-react";
import { GLOSSARY_ITEMS } from "@/constants/ashanti-pilot";
import { useAppShell } from "@/components/I18nProvider";

export function GlossaryPopoverBar() {
  const t = useTranslations("glossary");
  const { locale } = useAppShell();
  const baseId = useId().replace(/:/g, "");

  return (
    <section className="sf-card" aria-labelledby={`${baseId}-heading`}>
      <div className="sf-card-header">
        <div>
          <span className="label">{t("label")}</span>
          <h2 id={`${baseId}-heading`} className="sf-card-title">
            {t("title")}
          </h2>
          <p className="sf-card-subtitle">{t("subtitle")}</p>
        </div>
        <BookOpen size={20} className="text-[#275d38]" aria-hidden="true" />
      </div>

      <div className="sf-glossary-bar">
        {GLOSSARY_ITEMS.map((item) => {
          const popoverId = `${baseId}-${item.id}`;
          const triggerLabel = locale === "tw" ? item.termTw : item.term;
          const meaning = locale === "tw" ? item.plainMeaningTw : item.plainMeaning;
          return (
            <div key={item.id} className="sf-glossary-item">
              <button
                type="button"
                className="sf-glossary-trigger"
                {...({ popovertarget: popoverId } as Record<string, string>)}
              >
                <Info size={14} aria-hidden="true" />
                <span>{triggerLabel}</span>
              </button>

              <div
                id={popoverId}
                {...({ popover: "auto" } as Record<string, string>)}
                role="tooltip"
                className="sf-anchored-popover"
              >
                <div className="sf-anchored-popover-inner">
                  <p className="sf-popover-heading">{triggerLabel}</p>
                  <p className="sf-popover-copy">{meaning}</p>
                  <p className="sf-popover-why">{item.whyItMatters}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
