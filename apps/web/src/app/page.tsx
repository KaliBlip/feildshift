"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Brain, Compass, Leaf, Satellite, ShieldCheck, Smartphone } from "lucide-react";
import { AppNav } from "@/components/AppNav";

function FarmlandArt() {
  return (
    <svg
      viewBox="0 0 1200 420"
      xmlns="http://www.w3.org/2000/svg"
      className="satellite-svg"
      aria-label="Illustrative satellite-style Ashanti farmland visualization"
      role="img"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d2b1a" />
          <stop offset="100%" stopColor="#1a3d28" />
        </linearGradient>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d5a3d" />
          <stop offset="100%" stopColor="#1e4a2e" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a7c5e" />
          <stop offset="100%" stopColor="#3a6a4c" />
        </linearGradient>
        <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8aab7a" />
          <stop offset="100%" stopColor="#6a8f5a" />
        </linearGradient>
        <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4a855" />
          <stop offset="100%" stopColor="#a88c3a" />
        </linearGradient>
        <linearGradient id="g5" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5a8a6a" />
          <stop offset="100%" stopColor="#3d6a4e" />
        </linearGradient>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
        </radialGradient>
      </defs>
      <rect width="1200" height="420" fill="url(#sky)" />
      <polygon points="0,80 220,60 240,200 0,220" fill="url(#g1)" opacity="0.95" />
      <polygon points="220,60 420,40 450,180 240,200" fill="url(#g3)" opacity="0.9" />
      <polygon points="420,40 680,30 700,160 450,180" fill="url(#g4)" opacity="0.85" />
      <polygon points="680,30 920,50 930,190 700,160" fill="url(#g2)" opacity="0.9" />
      <polygon points="920,50 1200,30 1200,180 930,190" fill="url(#g5)" opacity="0.88" />
      <polygon points="0,220 240,200 260,350 0,370" fill="url(#g5)" opacity="0.9" />
      <polygon points="240,200 450,180 470,330 260,350" fill="url(#g1)" opacity="0.95" />
      <polygon points="450,180 700,160 720,310 470,330" fill="url(#g2)" opacity="0.88" />
      <polygon points="700,160 930,190 940,340 720,310" fill="url(#g3)" opacity="0.92" />
      <polygon points="930,190 1200,180 1200,360 940,340" fill="url(#g4)" opacity="0.82" />
      <rect x="755" y="140" width="120" height="70" rx="2" fill="none" stroke="#6bbcf5" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.7" />
      <text x="763" y="157" fontSize="9" fill="#6bbcf5" fontFamily="monospace">SMAP SOIL MOISTURE (9 km)</text>
      <circle cx="316" cy="96" r="24" fill="none" stroke="#8aab8e" strokeWidth="1.5" strokeDasharray="4,4" />
      <text x="275" y="65" fontSize="9" fill="#c8dbc9" fontFamily="monospace">HLS / iSDAsoil (30 m)</text>
      <text x="16" y="24" fontSize="9" fill="rgba(200,219,201,0.7)" fontFamily="monospace">
        ASHANTI PILOT GRID (50 x 50 KM) · GHANA
      </text>
      <rect width="1200" height="420" fill="url(#vignette)" />
    </svg>
  );
}

export default function LandingPage() {
  const t = useTranslations("hero");

  const pillars = [
    {
      icon: <Satellite size={22} />,
      title: "Earth Observation",
      body: "NASA GPM IMERG, SMAP L3/L4, MODIS/HLS NDVI, and iSDAsoil merged into a cloud-QA 10-day Ashanti cube.",
      tags: ["IMERG 10 km", "SMAP 9 km", "HLS 30 m", "iSDAsoil 30 m"],
    },
    {
      icon: <Brain size={22} />,
      title: "Decision Under Uncertainty",
      body: "2,000 Monte Carlo weight perturbations, climate stress-testing, and Minimax Regret identify robust rotations.",
      tags: ["2,000 Monte Carlo", "Minimax Regret", "Climate Analogs"],
    },
    {
      icon: <Leaf size={22} />,
      title: "Honest Evidence Passports",
      body: "Every score links directly to datasets used, pixel scale limits, information gaps, and local review checks.",
      tags: ["Scale Honesty", "Evidence Tiers", "Local Gaps"],
    },
    {
      icon: <Compass size={22} />,
      title: "2G Reach & Officer Governance",
      body: "English & Ashanti Twi interface, *920*44# USSD/SMS export, offline PWA caching, and officer-gated M8 calibration.",
      tags: ["EN & Twi", "*920*44# USSD", "RLS Officer Gate"],
    },
  ];

  return (
    <>
      <AppNav />
      <main>
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-grid" aria-hidden="true" />

          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" aria-hidden="true" />
              <span className="label" style={{ fontSize: "0.72rem" }}>
                {t("eyebrow")}
              </span>
            </div>

            <h1 id="hero-heading" className="display-xl hero-headline">
              {t("titleLead")} <em>{t("titleEmphasis")}</em>
            </h1>

            <p className="body-lg" style={{ maxWidth: "610px", marginInline: "auto" }}>
              {t("subtitle")}
            </p>

            <div className="hero-ctas">
              <Link href="/workspace" className="btn btn-primary btn-lg">
                <span>{t("ctaPrimary")}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/sms-ussd" className="btn btn-secondary btn-lg">
                <Smartphone size={17} aria-hidden="true" />
                <span>{t("ctaSecondary")}</span>
              </Link>
              <Link href="/officer" className="btn btn-secondary btn-lg">
                <ShieldCheck size={17} aria-hidden="true" />
                <span>{t("ctaOfficer")}</span>
              </Link>
            </div>
          </div>

          <div className="hero-imagery">
            <div className="hero-image-frame">
              <div className="hero-satellite-art">
                <FarmlandArt />
              </div>
            </div>
          </div>

          <div className="hero-scroll-hint" aria-hidden="true">
            <div className="scroll-line" />
            <span>{t("scroll")}</span>
          </div>
        </section>

        <section className="approach section" id="approach" aria-labelledby="approach-heading">
          <div className="container">
            <div className="approach-header">
              <span className="label">{t("aboutLabel")}</span>
              <div className="section-divider" style={{ marginInline: "auto" }} />
              <h2 id="approach-heading" className="display-lg approach-heading">
                {t("aboutTitle")}
              </h2>
              <p className="body-lg">{t("aboutSubtitle")}</p>
            </div>

            <div className="pillars">
              {pillars.map((pillar, i) => (
                <article
                  key={pillar.title}
                  className="pillar"
                  aria-labelledby={`pillar-title-${i}`}
                >
                  <span className="pillar-number" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="pillar-icon" aria-hidden="true">
                    {pillar.icon}
                  </div>
                  <h3 id={`pillar-title-${i}`} className="pillar-title">
                    {pillar.title}
                  </h3>
                  <p className="pillar-body">{pillar.body}</p>
                  <div className="pillar-tags">
                    {pillar.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
