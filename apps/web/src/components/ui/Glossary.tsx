"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { GLOSSARY_TERMS } from "./GlossaryData";
import type { GlossaryProps, GlossaryTerm, TooltipProps } from "./types";

export function GlossaryTooltip({ term, position = "top", open, onClose, anchorRef }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !anchorRef?.current) return;

    const anchor = anchorRef.current;
    const rect = anchor.getBoundingClientRect();
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const tooltipRect = tooltip.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top - tooltipRect.height - gap;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + gap;
        break;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }, [open, position, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={tooltipRef}
      className="glossary-tooltip"
      role="tooltip"
      style={{ position: "fixed", zIndex: 1000, pointerEvents: "auto" }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="tooltip-arrow" data-position={position} />
      <div className="tooltip-content">
        <div className="tooltip-header">
          <strong>{term.term}</strong>
          <button className="tooltip-close" onClick={onClose} aria-label="Close tooltip">×</button>
        </div>
        <p className="tooltip-definition">{term.shortDefinition}</p>
        <p className="tooltip-why">{term.whyItMatters}</p>
        {term.practicalExample && (
          <div className="tooltip-example">
            <span className="example-label">Example:</span>
            <span className="example-text">{term.practicalExample}</span>
          </div>
        )}
        {term.relatedTerms && term.relatedTerms.length > 0 && (
          <div className="tooltip-related">
            <span className="related-label">Related:</span>
            {term.relatedTerms.map((rt, i) => (
              <span key={i} className="related-term">{rt}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function GlossaryTooltipTrigger({ term, children, className = "" }: {
  term: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipTerm = GLOSSARY_TERMS.find((t) => t.term.toLowerCase() === term.toLowerCase());

  const handleClose = useCallback(() => setOpen(false), []);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Escape") setOpen(false);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  };

  return (
    <span
      className={`glossary-trigger ${className}`}
      ref={anchorRef}
      tabIndex={tooltipTerm ? 0 : undefined}
      role={tooltipTerm ? "button" : undefined}
      aria-label={tooltipTerm ? `Explain ${tooltipTerm.term}` : undefined}
      aria-expanded={tooltipTerm ? open : undefined}
      onClick={tooltipTerm ? () => setOpen((current) => !current) : undefined}
      onKeyDown={tooltipTerm ? handleKeyDown : undefined}
    >
      {children}
      {tooltipTerm && (
        <>
          <GlossaryTooltip
            term={tooltipTerm}
            position="top"
            open={open}
            onClose={handleClose}
            anchorRef={anchorRef}
          />
          <span className="trigger-indicator" aria-hidden="true">ⓘ</span>
        </>
      )}
    </span>
  );
}

export function Glossary({ terms = GLOSSARY_TERMS, onTermSelect }: GlossaryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  const filteredTerms = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortDefinition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.whyItMatters.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glossary" role="region" aria-label="Agricultural glossary">
      <div className="glossary-header">
        <h3>Plain-Language Agricultural Glossary</h3>
        <input
          type="search"
          placeholder="Search terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glossary-search"
          aria-label="Search glossary"
        />
      </div>

      <div className="glossary-layout">
        <nav className="glossary-list" aria-label="Glossary terms">
          <ul role="list">
            {filteredTerms.map((t) => (
              <li key={t.term}>
                <button
                  className={`glossary-term-btn ${selectedTerm?.term === t.term ? "active" : ""}`}
                  onClick={() => {
                    setSelectedTerm(t);
                    onTermSelect?.(t);
                  }}
                >
                  <span className="term-name">{t.term}</span>
                  <span className="term-preview">{t.shortDefinition.slice(0, 60)}…</span>
                </button>
              </li>
            ))}
            {filteredTerms.length === 0 && (
              <li className="no-results">No terms match &quot;{searchQuery}&quot;</li>
            )}
          </ul>
        </nav>

        {selectedTerm && (
          <article className="glossary-detail" aria-labelledby="detail-term">
            <h4 id="detail-term">{selectedTerm.term}</h4>
            <dl className="term-definition">
              <dt>What it means</dt>
              <dd>{selectedTerm.shortDefinition}</dd>
              <dt>Why it matters for farming</dt>
              <dd>{selectedTerm.whyItMatters}</dd>
              {selectedTerm.practicalExample && (
                <>
                  <dt>Practical example</dt>
                  <dd className="example">{selectedTerm.practicalExample}</dd>
                </>
              )}
            </dl>
            {selectedTerm.relatedTerms && selectedTerm.relatedTerms.length > 0 && (
              <div className="term-related">
                <strong>Related terms:</strong>
                <ul>
                  {selectedTerm.relatedTerms.map((rt, i) => (
                    <li key={i}>
                      <button
                        className="related-link"
                        onClick={() => {
                          const related = terms.find((t) => t.term === rt);
                          if (related) setSelectedTerm(related);
                        }}
                      >
                        {rt}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}

export function InlineGlossary({ term, children }: { term: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipTerm = GLOSSARY_TERMS.find((t) => t.term.toLowerCase() === term.toLowerCase());
  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Escape") setOpen(false);
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  };

  return (
    <span
      className="inline-glossary-trigger"
      ref={anchorRef}
      tabIndex={tooltipTerm ? 0 : undefined}
      role={tooltipTerm ? "button" : undefined}
      aria-label={tooltipTerm ? `Explain ${tooltipTerm.term}` : undefined}
      aria-expanded={tooltipTerm ? open : undefined}
      onClick={tooltipTerm ? () => setOpen((current) => !current) : undefined}
      onKeyDown={tooltipTerm ? handleKeyDown : undefined}
    >
      {children}
      {tooltipTerm && (
        <>
          <GlossaryTooltip
            term={tooltipTerm}
            position="top"
            open={open}
            onClose={() => setOpen(false)}
            anchorRef={anchorRef}
          />
          <span className="inline-indicator" aria-hidden="true">?</span>
        </>
      )}
    </span>
  );
}