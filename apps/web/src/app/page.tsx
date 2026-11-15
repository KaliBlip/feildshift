"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Brain, Compass, Leaf, Satellite, ShieldCheck, Smartphone } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { SeasonalVulnerabilityCalendar } from "@/components/calendar";
import { MapExplorer } from "@/components/map";
import { ScaleHonestyBanner } from "@/components/scale-honesty";
import { StrategyComparisonSection } from "@/components/decision/StrategyComparisonSection";
import { Glossary, GlossaryTooltipTrigger, InlineGlossary } from "@/components/ui";
import { dataAccess } from "@/lib/data-access";
import { calendarFixtures, mapFixtures, scaleHonestyFixtures } from "@/lib/fixtures";
import type { CalendarData, MapData } from "@/lib/data-access";

/* ─── Farmland SVG Art ──────────────────────────────────────────────── */
function FarmlandArt() {
  return (
    <svg
      viewBox="0 0 1200 420"
      xmlns="http://www.w3.org/2000/svg"
      className="satellite-svg"
      aria-label="Satellite-derived Ashanti farmland visualization"
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
      <text x="763" y="157" fontSize="9" fill="#6bbcf5" fontFamily="monospace">SMAP / ERA5-Land (9 km)</text>
      <circle cx="316" cy="96" r="24" fill="none" stroke="#8aab8e" strokeWidth="1.5" strokeDasharray="4,4" />
      <text x="275" y="65" fontSize="9" fill="#c8dbc9" fontFamily="monospace">HLS / iSDAsoil (30 m)</text>
      <text x="16" y="24" fontSize="9" fill="rgba(200,219,201,0.7)" fontFamily="monospace">
        ASHANTI PILOT GRID (50 x 50 KM) · GHANA
      </text>
      <rect width="1200" height="420" fill="url(#vignette)" />
    </svg>
  );
}

/* ─── Challenge ─────────────────────────────────────────────────────── */
function Challenge() {
  return (
    <section className="challenge section" id="about" aria-labelledby="challenge-heading">
      <div className="container">
        <div className="challenge-inner">
          <div>
            <span className="label challenge-label reveal">The Challenge</span>
            <div className="section-divider" style={{ background: "linear-gradient(90deg, #8aab8e, #4a7c5e)" }} />
            <h2 id="challenge-heading" className="display-lg challenge-heading reveal reveal-delay-1">
              Farming in a<br />changing climate.
            </h2>
            <p className="body-lg challenge-body reveal reveal-delay-2">
              Growing seasons are shifting. Rain can arrive late, stop early,
              or fall in intense bursts. With changing heat and water stress,
              each season brings new uncertainty to decisions made in the field.
            </p>
            <p className="body-lg challenge-body reveal reveal-delay-3" style={{ marginTop: "1rem" }}>
              Earth observations offer a wider view, but turning satellite
              signals into useful local context takes care, agricultural
              knowledge, and an honest account of what the data can — and
              cannot — tell us.
            </p>
          </div>

          <div className="challenge-stats reveal reveal-delay-2">
            {[
              {
                title: "Shifting seasons",
                body: "Planting windows can move as temperature and rainfall patterns change.",
              },
              {
                title: "Uncertain rainfall",
                body: "Timing and distribution matter as much as seasonal totals.",
              },
              {
                title: "Water and heat stress",
                body: "Local conditions can vary across a landscape and from season to season.",
              },
              {
                title: "Fragmented signals",
                body: "Satellite data needs context before it can support a farm-level decision.",
              },
            ].map((signal, i) => (
              <article className="stat-card" key={signal.title}>
                <span className="challenge-signal-index">0{i + 1} / FIELD REALITY</span>
                <h3 className="challenge-signal-title">{signal.title}</h3>
                <p className="challenge-signal-body">{signal.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Seasonal Vulnerability Calendar ───────────────────────────────── */
function VulnerabilityCalendarSection() {
  const [calendarData, setCalendarData] = useState<CalendarData>(calendarFixtures);
  const [selectedDekad, setSelectedDekad] = useState<string | null>(null);
  const [usingFixtures, setUsingFixtures] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dataAccess.fetchCalendarData();
        setCalendarData(data);
        setUsingFixtures(data.source === "fixtures");
      } catch (error) {
        console.error("Failed to load calendar data:", error);
        setCalendarData({ ...calendarFixtures, loadingState: "error", errorMessage: "Failed to load data" });
      }
    };
    loadData();
  }, []);

  const handleDekadSelect = (dekad: string | null) => {
    setSelectedDekad(dekad);
  };

  return (
    <section className="calendar-section section" id="calendar" aria-labelledby="calendar-heading">
      <div className="container">
        <div className="section-header">
          <span className="label">Environmental Intelligence</span>
          <div className="section-divider" />
          <h2 id="calendar-heading" className="display-lg">
            Seasonal Vulnerability &amp; Bare-Field Calendar
          </h2>
          <p className="body-lg">
            Explore dekad-by-dekad environmental conditions across the agricultural season.{" "}
            <InlineGlossary term="Dekad">dekads</InlineGlossary> (10-day periods) reveal how{" "}
            <InlineGlossary term="Rainfall reliability">rainfall reliability</InlineGlossary>,{" "}
            <InlineGlossary term="Soil moisture anomaly">soil moisture</InlineGlossary>,{" "}
            <InlineGlossary term="NDVI">vegetation cover</InlineGlossary>,{" "}
            <InlineGlossary term="Heat stress">heat stress</InlineGlossary>, and{" "}
            <InlineGlossary term="Bare-field period">bare-field exposure</InlineGlossary>{" "}
            evolve throughout the year.
          </p>
        </div>

        <div className="data-source-badge">
          {usingFixtures ? (
            <span className="fixture-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="6" />
                <path d="M7 4v6M4 7h6" />
              </svg>
              Offline Ashanti Pilot Bundle (Validated 30 m HLS + 30 m iSDAsoil + NASA POWER)
            </span>
          ) : (
            <span className="live-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="7" cy="7" r="7" />
              </svg>
              Live Supabase data (30 m HLS + 30 m iSDAsoil + NASA POWER + ERA5-Land)
            </span>
          )}
        </div>

        <SeasonalVulnerabilityCalendar
          observations={calendarData.observations}
          seasons={calendarData.seasons}
          anomalies={calendarData.anomalies}
          bareFieldPeriods={calendarData.bareFieldPeriods}
          loadingState={calendarData.loadingState}
          errorMessage={calendarData.errorMessage}
          selectedDekad={selectedDekad}
          onSelectDekad={handleDekadSelect}
          farmAreaHa={calendarData.farmAreaHa}
          farmLabel={calendarData.farmLabel}
        />
      </div>
    </section>
  );
}

/* ─── Interactive Map Explorer ──────────────────────────────────────── */
function MapExplorerSection() {
  const [mapData, setMapData] = useState<MapData>(mapFixtures);
  const [enabledLayers, setEnabledLayers] = useState<("ndvi" | "soil-moisture" | "rainfall" | "srtm")[]>([...mapFixtures.enabledLayers]);
  const [selectedTimeStep, setSelectedTimeStep] = useState(mapFixtures.selectedTimeStep);
  const [viewport, setViewport] = useState({ center: mapFixtures.center, zoom: mapFixtures.zoom });
  const [usingFixtures, setUsingFixtures] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dataAccess.fetchMapData();
        setMapData(data);
        setUsingFixtures(data.source === "fixtures");
      } catch (error) {
        console.error("Failed to load map data:", error);
        setMapData({ ...mapFixtures, loadingState: "error", errorMessage: "Failed to load map" });
      }
    };
    loadData();
  }, []);

  const handleLayerToggle = (layerId: string, enabled?: boolean) => {
    if (layerId !== "ndvi" && layerId !== "soil-moisture" && layerId !== "rainfall" && layerId !== "srtm") return;
    const selectedLayer = layerId;
    setEnabledLayers((prev) => {
      const shouldEnable = enabled ?? !prev.includes(selectedLayer);
      if (shouldEnable) return prev.includes(selectedLayer) ? prev : [...prev, selectedLayer];
      return prev.filter((layer) => layer !== selectedLayer);
    });
  };

  const handleTimeChange = (timeStep: typeof selectedTimeStep) => {
    setSelectedTimeStep(timeStep);
  };

  const handleViewportChange = (newViewport: { center: [number, number]; zoom: number }) => {
    setViewport(newViewport);
  };

  return (
    <section className="map-section section" id="map" aria-labelledby="map-heading">
      <div className="container">
        <div className="section-header">
          <span className="label">Environmental Intelligence</span>
          <div className="section-divider" />
          <h2 id="map-heading" className="display-lg">
            Interactive Map Explorer
          </h2>
          <p className="body-lg">
            Explore environmental conditions spatially across the pilot area. Toggle{" "}
            <GlossaryTooltipTrigger term="NDVI">NDVI (30 m HLS)</GlossaryTooltipTrigger>,{" "}
            <GlossaryTooltipTrigger term="Soil moisture anomaly">soil moisture</GlossaryTooltipTrigger>,{" "}
            <GlossaryTooltipTrigger term="Rainfall reliability">rainfall</GlossaryTooltipTrigger>, and{" "}
            <GlossaryTooltipTrigger term="Spatial resolution">terrain</GlossaryTooltipTrigger>{" "}
            layers, and scrub through time to see how conditions change.
          </p>
        </div>

        <div className="data-source-badge">
          {usingFixtures ? (
            <span className="fixture-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="6" />
                <path d="M7 4v6M4 7h6" />
              </svg>
              Offline Ashanti Pilot Bundle (Validated 30 m HLS + 30 m iSDAsoil)
            </span>
          ) : (
            <span className="live-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="7" cy="7" r="7" />
              </svg>
              Live Supabase data
            </span>
          )}
        </div>

        <MapExplorer
          center={viewport.center}
          zoom={viewport.zoom}
          layers={mapData.layers}
          timeSteps={mapData.timeSteps}
          loadingState={mapData.loadingState}
          errorMessage={mapData.errorMessage}
          farmBoundary={mapData.farmBoundary}
          farmAreaHa={mapData.farmAreaHa}
          onLayerToggle={handleLayerToggle}
          onTimeChange={handleTimeChange}
          onViewportChange={handleViewportChange}
          enabledLayers={enabledLayers}
          selectedTimeStep={selectedTimeStep}
        />

        <ScaleHonestyBanner
          assessments={scaleHonestyFixtures(mapData.farmAreaHa || 2.0)}
          farmAreaHa={mapData.farmAreaHa}
          farmLabel={mapData.farmBoundary?.properties?.name as string}
          selectedLayerId={enabledLayers[0]}
          onLayerSelect={handleLayerToggle}
        />
      </div>
    </section>
  );
}

/* ─── Agricultural Glossary ─────────────────────────────────────────── */
function GlossarySection() {
  return (
    <section className="glossary-section section" id="glossary" aria-labelledby="glossary-heading">
      <div className="container">
        <div className="section-header">
          <span className="label">Reference</span>
          <div className="section-divider" />
          <h2 id="glossary-heading" className="display-lg">
            Plain-Language Agricultural Glossary
          </h2>
          <p className="body-lg">
            Technical terms used throughout this platform, explained in plain language
            for farmers, extension officers, and decision-makers.
          </p>
        </div>

        <Glossary />
      </div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const t = useTranslations("hero");

  const pillars = [
    {
      icon: <Satellite size={22} />,
      title: "Earth Observation",
      body: "30 m NASA HLS (L30/S30) NDVI, 30 m iSDAsoil v2, 90 m Copernicus DEM, 1 km MODIS LST, NASA POWER, and 9 km ERA5-Land.",
      tags: ["HLS 30 m", "iSDAsoil 30 m", "Copernicus 90 m", "ERA5-Land 9 km"],
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

        <Challenge />

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

        <StrategyComparisonSection />
        <VulnerabilityCalendarSection />
        <MapExplorerSection />
        <GlossarySection />
      </main>

      <footer className="border-t border-[#E2E4E9] bg-[#171717] py-12 text-[#EFEFEF]">
        <div className="container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="font-display text-lg font-bold text-white">
              ScalarField · Field Shift
            </p>
            <p className="max-w-md text-xs text-[#B4B6BE]">
              Evidence-graded crop-rotation decision support for Ashanti, Ghana,
              powered by global NASA Earth observations and local MoFA/CSIR-CRI
              expertise.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-4 text-xs font-semibold">
            <Link href="/workspace" className="text-[#EFEFEF] hover:text-[#F9D601]">
              Decision Studio
            </Link>
            <Link href="/officer" className="text-[#EFEFEF] hover:text-[#F9D601]">
              Officer Portal
            </Link>
            <Link href="/sms-ussd" className="text-[#EFEFEF] hover:text-[#F9D601]">
              SMS / USSD
            </Link>
            <Link href="/login" className="text-[#F9D601] hover:underline">
              PIN Sign In
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
