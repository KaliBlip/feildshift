"use client";
import { useEffect, useRef, useState } from "react";

/* ─── Inline SVG Icons ──────────────────────────────────────────────── */
function IconSatellite({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7L17 3M17 3L21 7M17 3V13" />
      <path d="M7 17L3 21" />
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
      <path d="M11 13L13 11" />
    </svg>
  );
}

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

/* ─── Farmland SVG Art ──────────────────────────────────────────────── */
function FarmlandArt() {
  return (
    <svg
      viewBox="0 0 1200 420"
      xmlns="http://www.w3.org/2000/svg"
      className="satellite-svg"
      aria-label="Illustrative satellite-style farmland visualization"
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
        <linearGradient id="g6" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a4a30" />
          <stop offset="100%" stopColor="#1d3824" />
        </linearGradient>
        <linearGradient id="g7" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7a9e6a" />
          <stop offset="100%" stopColor="#5a7e4e" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2d5fa6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1a3d6a" stopOpacity="0.9" />
        </linearGradient>
        <filter id="blur-sm">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
        </radialGradient>
      </defs>

      {/* Sky / base */}
      <rect width="1200" height="420" fill="url(#sky)" />

      {/* Large field blocks */}
      <polygon points="0,80 220,60 240,200 0,220" fill="url(#g1)" opacity="0.95" />
      <polygon points="220,60 420,40 450,180 240,200" fill="url(#g3)" opacity="0.9" />
      <polygon points="420,40 680,30 700,160 450,180" fill="url(#g4)" opacity="0.85" />
      <polygon points="680,30 920,50 930,190 700,160" fill="url(#g2)" opacity="0.9" />
      <polygon points="920,50 1200,30 1200,180 930,190" fill="url(#g5)" opacity="0.88" />

      <polygon points="0,220 240,200 260,350 0,370" fill="url(#g5)" opacity="0.9" />
      <polygon points="240,200 450,180 470,330 260,350" fill="url(#g6)" opacity="0.95" />
      <polygon points="450,180 700,160 720,310 470,330" fill="url(#g2)" opacity="0.88" />
      <polygon points="700,160 930,190 950,340 720,310" fill="url(#g3)" opacity="0.85" />
      <polygon points="930,190 1200,180 1200,380 950,340" fill="url(#g4)" opacity="0.82" />

      {/* Bottom strip */}
      <polygon points="0,370 260,350 280,420 0,420" fill="url(#g7)" opacity="0.9" />
      <polygon points="260,350 470,330 500,420 280,420" fill="url(#g1)" opacity="0.88" />
      <polygon points="470,330 720,310 750,420 500,420" fill="url(#g3)" opacity="0.85" />
      <polygon points="720,310 950,340 980,420 750,420" fill="url(#g5)" opacity="0.9" />
      <polygon points="950,340 1200,380 1200,420 980,420" fill="url(#g4)" opacity="0.82" />

      {/* Field boundary lines (roads/paths) */}
      <line x1="240" y1="60" x2="260" y2="420" stroke="#0d1f14" strokeWidth="2.5" opacity="0.6" />
      <line x1="450" y1="40" x2="500" y2="420" stroke="#0d1f14" strokeWidth="2" opacity="0.5" />
      <line x1="700" y1="30" x2="750" y2="420" stroke="#0d1f14" strokeWidth="2.5" opacity="0.6" />
      <line x1="930" y1="50" x2="980" y2="420" stroke="#0d1f14" strokeWidth="2" opacity="0.5" />
      <line x1="0" y1="200" x2="1200" y2="175" stroke="#0d1f14" strokeWidth="2" opacity="0.4" />
      <line x1="0" y1="340" x2="1200" y2="330" stroke="#0d1f14" strokeWidth="2" opacity="0.4" />

      {/* Irrigation canal */}
      <path d="M 580 0 C 590 100, 600 200, 610 420" stroke="url(#water)" strokeWidth="8" fill="none" opacity="0.7" />

      {/* Circular irrigation fields */}
      <ellipse cx="160" cy="130" rx="70" ry="55" fill="url(#g3)" opacity="0.6" />
      <ellipse cx="160" cy="130" rx="70" ry="55" fill="none" stroke="#8aab7a" strokeWidth="1" strokeDasharray="4,6" opacity="0.5" />

      <ellipse cx="820" cy="260" rx="90" ry="65" fill="url(#g7)" opacity="0.55" />
      <ellipse cx="820" cy="260" rx="90" ry="65" fill="none" stroke="#8aab7a" strokeWidth="1" strokeDasharray="4,6" opacity="0.4" />

      {/* Row crop texture lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1={30 + i * 15}
          y1="80"
          x2={30 + i * 15}
          y2="195"
          stroke="#3a6a4c"
          strokeWidth="1"
          opacity="0.35"
        />
      ))}
      {Array.from({ length: 15 }).map((_, i) => (
        <line
          key={i}
          x1={700 + i * 14}
          y1="50"
          x2={700 + i * 14}
          y2="165"
          stroke="#6a9a7e"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}

      {/* Data overlay elements */}
      {/* NDVI scanner box */}
      <rect x="330" y="55" width="100" height="80" rx="2" fill="none" stroke="#74c68e" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.7" />
      <text x="338" y="72" fontSize="8" fill="#74c68e" opacity="0.9" fontFamily="monospace">VEGETATION</text>
      <line x1="330" y1="55" x2="318" y2="45" stroke="#74c68e" strokeWidth="1" opacity="0.6" />
      <circle cx="316" cy="43" r="2" fill="#74c68e" opacity="0.8" />

      {/* Moisture indicator */}
      <rect x="755" y="140" width="120" height="70" rx="2" fill="none" stroke="#6bbcf5" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.65" />
      <text x="763" y="157" fontSize="8" fill="#6bbcf5" opacity="0.9" fontFamily="monospace">SOIL MOISTURE</text>
      <text x="763" y="170" fontSize="7" fill="#6bbcf5" opacity="0.6" fontFamily="monospace">EARTH OBSERVATION</text>

      {/* Temperature spot */}
      <circle cx="1060" cy="80" r="22" fill="none" stroke="#f5a66b" strokeWidth="1.5" strokeDasharray="4,5" opacity="0.6" />
      <text x="1050" y="77" fontSize="7" fill="#f5a66b" opacity="0.85" fontFamily="monospace">LAND SURFACE</text>
      <text x="1047" y="88" fontSize="6" fill="#f5a66b" opacity="0.6" fontFamily="monospace">TEMPERATURE</text>

      {/* Scan lines overlay */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={i}
          x1="0"
          y1={i * 55}
          x2="1200"
          y2={i * 55}
          stroke="rgba(138,171,142,0.04)"
          strokeWidth="1"
        />
      ))}

      {/* Coordinate grid overlay */}
      <text x="12" y="20" fontSize="8" fill="rgba(138,171,142,0.5)" fontFamily="monospace">ILLUSTRATIVE FIELD VIEW · ASHANTI REGION, GHANA</text>
      <text x="1050" y="20" fontSize="8" fill="rgba(138,171,142,0.5)" fontFamily="monospace">EARTH OBSERVATION</text>

      {/* Vignette */}
      <rect width="1200" height="420" fill="url(#vignette)" />
    </svg>
  );
}

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
      icon: <IconSatellite size={22} />,
      title: "Earth Observation",
      body: "Satellite observations reveal patterns in rainfall, soil moisture, vegetation, and heat stress across places and seasons.",
      tags: ["NASA IMERG", "SMAP", "Landsat HLS", "MODIS NDVI"],
    },
    {
      icon: <IconBrain size={22} />,
      title: "Machine Learning",
      body: "Statistical and machine-learning methods help explore patterns and scenarios, alongside clear uncertainty and limitations.",
      tags: ["Pattern Discovery", "Scenario Analysis", "Uncertainty"],
    },
    {
      icon: <IconLeaf size={22} />,
      title: "Agricultural Science",
      body: "Agronomic principles and local evidence provide essential context. Satellite patterns alone are not farm-level measurements or proof of crop outcomes.",
      tags: ["Crop Science", "Soil Health", "Evidence Quality"],
    },
    {
      icon: <IconCompass size={22} />,
      title: "Farmer-Centred Decisions",
      body: "Insights are shaped around farmer priorities and expert review, offering useful context while leaving decisions with the people who know the land.",
      tags: ["Farmer Priorities", "Local Context", "Expert Review"],
    },
  ];

  return (
    <section className="approach section" id="approach" ref={ref} aria-labelledby="approach-heading">
      <div className="container">
        <div className="approach-header">
          <span className="label reveal">Our Approach</span>
          <div className="section-divider" style={{ marginInline: "auto" }} />
          <h2 id="approach-heading" className="display-lg approach-heading reveal reveal-delay-1">
            Four pillars.<br />One clear picture.
          </h2>
          <p className="body-lg reveal reveal-delay-2" id="science">
            We bring NASA Earth science together with agricultural knowledge
            to make environmental data easier to interpret for real decisions.
          </p>
        </div>

        <div className="pillars">
          {pillars.map((pillar, i) => (
            <article
              key={pillar.title}
              className={`pillar reveal reveal-delay-${i + 1}`}
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
              <div className="pillar-tags" aria-label="Related technologies">
                {pillar.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA & Footer ──────────────────────────────────────────────────── */
function ClosingCTA() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = ref.current?.querySelectorAll(".reveal");
    if (!els) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.2 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="cta-section section" id="cta" ref={ref} aria-labelledby="cta-heading">
        <div className="container cta-inner">
          <span className="label reveal">Early Access</span>
          <div className="section-divider" style={{ marginInline: "auto" }} />
          <h2 id="cta-heading" className="display-lg cta-heading reveal reveal-delay-1">
            A smarter perspective on<br />the future of farming.
          </h2>
          <p className="body-lg reveal reveal-delay-2" style={{ maxWidth: "520px", marginInline: "auto" }}>
            Join agricultural researchers, extension officers, and farming
            cooperatives exploring a more resilient food system — one field at a time.
          </p>
          <div className="cta-actions reveal reveal-delay-3">
            <a href="mailto:hello@scalarfield.io" className="btn btn-primary btn-lg">
              Request Early Access
              <IconArrow size={18} />
            </a>
            <a href="#approach" className="btn btn-secondary btn-lg">
              Explore the Platform
            </a>
          </div>
          <p className="reveal reveal-delay-4" style={{ marginTop: "2rem", fontSize: "0.8125rem", color: "var(--fg-muted)" }}>
            Initial focus: Ashanti Region, Ghana
          </p>
        </div>
      </section>

      <footer className="footer" aria-label="Site footer">
        <div className="container footer-inner">
          <div className="footer-logo">
            <LogoMark size={28} dark />
            <span>ScalarField</span>
          </div>
          <ul className="footer-links" role="list">
            <li><a href="#about">About</a></li>
            <li><a href="#approach">Approach</a></li>
            <li><a href="#science">Science</a></li>
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
      </main>
      <ClosingCTA />
    </>
  );
}
