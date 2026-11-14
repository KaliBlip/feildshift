"use client";

import { useEffect, useRef, useState } from "react";
import { SeasonalVulnerabilityCalendar } from "@/components/calendar";
import { MapExplorer } from "@/components/map";
import { ScaleHonestyBanner } from "@/components/scale-honesty";
import { StrategyComparisonSection } from "@/components/decision/StrategyComparisonSection";
import { Glossary, GlossaryTooltipTrigger, InlineGlossary } from "@/components/ui";
import { dataAccess } from "@/lib/data-access";
import { calendarFixtures, mapFixtures, scaleHonestyFixtures } from "@/lib/fixtures";
import type { CalendarData, MapData } from "@/lib/data-access";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Brain, Compass, Leaf, Satellite, ShieldCheck, Smartphone } from "lucide-react";
import { AppNav } from "@/components/AppNav";

function IconBrain({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.68 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.68 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z" />
    </svg>
  );
}

function IconLeaf({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function IconCompass({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function IconArrow({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function IconGlobe({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  );
}

function IconRuler({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h18v18H3z" />
      <path d="M3 9h18M9 3v18" />
    </svg>
  );
}

function IconBook({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

/* ─── Farmland SVG Art ──────────────────────────────────────────────── */
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
/* ─── Logo Mark ─────────────────────────────────────────────────────── */
function LogoMark({ size = 32, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={dark ? "rgba(255,255,255,0.12)" : "#1a3d28"} />
      {/* Stylised S field glyph */}
      <path d="M10 11.5 C10 9.567 11.567 8 13.5 8 L19 8 C20.657 8 22 9.343 22 11 C22 12.657 20.657 14 19 14 L13 14 C11.343 14 10 15.343 10 17 C10 18.657 11.343 20 13 20 L19.5 20 C21.433 20 23 21.567 23 23.5" stroke={dark ? "#74c68e" : "#8aab8e"} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="10" cy="11.5" r="1.5" fill={dark ? "#74c68e" : "#8aab8e"} />
      <circle cx="23" cy="23.5" r="1.5" fill={dark ? "#74c68e" : "#8aab8e"} />
    </svg>
  );
}

/* ─── Nav ───────────────────────────────────────────────────────────── */
function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="nav" ref={navRef} aria-label="Main navigation">
      <div className="container nav-inner">
        <a href="#" className="nav-logo" aria-label="ScalarField home">
          <LogoMark size={32} />
          <span>ScalarField</span>
        </a>

        <ul id="primary-navigation" className={`nav-links${menuOpen ? " is-open" : ""}`} role="list">
          <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
          <li><a href="#approach" onClick={() => setMenuOpen(false)}>Our Approach</a></li>
          <li><a href="#science" onClick={() => setMenuOpen(false)}>Data & Science</a></li>
          <li><a href="#strategies" onClick={() => setMenuOpen(false)}>Strategies</a></li>
          <li><a href="#calendar" onClick={() => setMenuOpen(false)}>Vulnerability Calendar</a></li>
          <li><a href="#map" onClick={() => setMenuOpen(false)}>Map Explorer</a></li>
          <li className="nav-mobile-signin">
            <a href="mailto:hello@scalarfield.io?subject=ScalarField%20account%20access" onClick={() => setMenuOpen(false)}>
              Sign In
            </a>
          </li>
        </ul>

        <div className="nav-actions">
          <a href="mailto:hello@scalarfield.io?subject=ScalarField%20account%20access" className="btn btn-ghost nav-signin">
            Sign In
          </a>
          <a href="#cta" className="btn btn-primary nav-get-started">
            Get Started
          </a>
          <button
            type="button"
            className={`nav-menu-toggle${menuOpen ? " is-open" : ""}`}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-eyebrow animate-fade-up">
          <span className="hero-eyebrow-dot" aria-hidden="true" />
          <span className="label" style={{ fontSize: "0.7rem" }}>
            Informed by NASA Earth Observations
          </span>
        </div>

        <h1 id="hero-heading" className="display-xl hero-headline animate-fade-up animate-delay-1">
          Agriculture,{" "}
          <em>Informed<br />by Earth.</em>
        </h1>

        <p className="body-lg animate-fade-up animate-delay-2" style={{ maxWidth: "560px", marginInline: "auto" }}>
          ScalarField brings Earth observations, machine learning, and
          agricultural science together to help farmers make sense of changing
          conditions and explore resilient choices.
        </p>

        <div className="hero-ctas animate-fade-up animate-delay-3">
          <a href="#cta" className="btn btn-primary btn-lg">
            Request Early Access
            <IconArrow size={18} />
          </a>
          <a href="#approach" className="btn btn-secondary btn-lg">
            See How It Works
          </a>
        </div>
      </div>

      <div className="hero-imagery animate-fade-up animate-delay-4">
        <div className="hero-image-frame">
          <div className="hero-satellite-art">
            <FarmlandArt />
          </div>
        </div>
      </div>

      <div className="hero-scroll-hint" aria-hidden="true">
        <div className="scroll-line" />
        <span>Scroll</span>
      </div>
    </section>
  );
}

/* ─── Challenge ─────────────────────────────────────────────────────── */
function Challenge() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = ref.current?.querySelectorAll(".reveal");
    if (!els) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="challenge section" id="about" ref={ref} aria-labelledby="challenge-heading">
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

/* ─── Approach ──────────────────────────────────────────────────────── */
function Approach() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = ref.current?.querySelectorAll(".reveal");
    if (!els) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
/* ─── Seasonal Vulnerability Calendar ───────────────────────────────── */
function VulnerabilityCalendarSection() {
  const [calendarData, setCalendarData] = useState<CalendarData>(calendarFixtures);
  const [loading, setLoading] = useState(true);
  const [selectedDekad, setSelectedDekad] = useState<string | null>(null);
  const [usingFixtures, setUsingFixtures] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await dataAccess.fetchCalendarData();
        setCalendarData(data);
        setUsingFixtures(data.source === "fixtures");
      } catch (error) {
        console.error("Failed to load calendar data:", error);
        setCalendarData({ ...calendarFixtures, loadingState: "error", errorMessage: "Failed to load data" });
      } finally {
        setLoading(false);
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
            Seasonal Vulnerability & Bare-Field Calendar
          </h2>
          <p className="body-lg">
            Explore dekad-by-dekad environmental conditions across the agricultural season.
            <InlineGlossary term="Dekad">dekads</InlineGlossary> (10-day periods) reveal how
            <InlineGlossary term="Rainfall reliability">rainfall reliability</InlineGlossary>,
            <InlineGlossary term="Soil moisture anomaly">soil moisture</InlineGlossary>,
            <InlineGlossary term="NDVI">vegetation cover</InlineGlossary>,
            <InlineGlossary term="Heat stress">heat stress</InlineGlossary>, and
            <InlineGlossary term="Bare-field period">bare-field exposure</InlineGlossary>
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
              Illustrative fixture data — not real observations
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
  const [loading, setLoading] = useState(true);
  const [enabledLayers, setEnabledLayers] = useState<("ndvi" | "soil-moisture" | "rainfall" | "srtm")[]>([...mapFixtures.enabledLayers]);
  const [selectedTimeStep, setSelectedTimeStep] = useState(mapFixtures.selectedTimeStep);
  const [viewport, setViewport] = useState({ center: mapFixtures.center, zoom: mapFixtures.zoom });
  const [usingFixtures, setUsingFixtures] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await dataAccess.fetchMapData();
        setMapData(data);
        setUsingFixtures(data.source === "fixtures");
      } catch (error) {
        console.error("Failed to load map data:", error);
        setMapData({ ...mapFixtures, loadingState: "error", errorMessage: "Failed to load map" });
      } finally {
        setLoading(false);
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
            Explore environmental conditions spatially across the pilot area. Toggle
            <GlossaryTooltipTrigger term="NDVI">NDVI</GlossaryTooltipTrigger>,
            <GlossaryTooltipTrigger term="Soil moisture anomaly">soil moisture</GlossaryTooltipTrigger>,
            <GlossaryTooltipTrigger term="Rainfall reliability">rainfall</GlossaryTooltipTrigger>, and
            <GlossaryTooltipTrigger term="Spatial resolution">terrain</GlossaryTooltipTrigger>
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
              Illustrative fixture data — tile layers are placeholders
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
          assessments={scaleHonestyFixtures(mapData.farmAreaHa || 42.5)}
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

/* ─── CTA & Footer ──────────────────────────────────────────────────── */
function ClosingCTA() {
  const ref = useRef<HTMLElement>(null);

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
          <ul className="footer-links" role="list">
            <li><a href="#about">About</a></li>
            <li><a href="#approach">Approach</a></li>
            <li><a href="#science">Science</a></li>
            <li><a href="#strategies">Strategies</a></li>
            <li><a href="#calendar">Calendar</a></li>
            <li><a href="#map">Map</a></li>
            <li><a href="#glossary">Glossary</a></li>
            <li><a href="mailto:hello@scalarfield.io">Contact</a></li>
          </ul>
          <p className="footer-credit">
            Informed by NASA Earth Observations<br />
            <span style={{ opacity: 0.4 }}>© ScalarField</span>
          </p>
        </div>
      </footer>
    </>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Challenge />
        <Approach />
        <StrategyComparisonSection />
        <VulnerabilityCalendarSection />
        <MapExplorerSection />
        <GlossarySection />
      </main>
    </>
  );
}