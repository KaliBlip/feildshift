import type { CSSProperties } from "react";

import { baseScores, rankProbabilities } from "@/lib/scoring";

const PREVIEW_SCORING_DATA = {
  strategies: ["Existing rotation", "Strategy A", "Strategy B"],
  criteria: [
    "Water efficiency",
    "Soil health",
    "Erosion protection",
    "Income and market",
  ],
  scores: [
    [0.55, 0.4, 0.5, 0.3],
    [0.7, 0.65, 0.6, 0.55],
    [0.6, 0.8, 0.75, 0.45],
  ],
  weights: [0.4, 0.3, 0.2, 0.1],
};

interface PipelineLayer {
  title: string;
  summary: string;
  artifactPath: string;
}

const ARCHITECTURE_LAYERS: PipelineLayer[] = [
  {
    title: "Offline Earth Observation Pipeline",
    summary:
      "Ingests NASA IMERG, SMAP, Landsat/HLS, MODIS/VIIRS, POWER, and SRTM into a harmonised dekad cube for Ashanti Region.",
    artifactPath: "pipeline/config/pilot.yaml",
  },
  {
    title: "Transparent Multi-Criteria Scoring",
    summary:
      "Computes deterministic priority-weighted scores and Monte Carlo rank stability in TypeScript and Python from shared fixtures.",
    artifactPath: "apps/web/src/lib/scoring.ts",
  },
  {
    title: "Evidence Passport & Local Review",
    summary:
      "Attaches dataset provenance, scale-honesty limits, information gaps, and required agronomist validation checks to every card.",
    artifactPath: "knowledge/README.md",
  },
];

export default function Home() {
  const computedBaseScores = baseScores(
    PREVIEW_SCORING_DATA.scores,
    PREVIEW_SCORING_DATA.weights,
  );
  const stability = rankProbabilities(
    PREVIEW_SCORING_DATA.scores,
    PREVIEW_SCORING_DATA.weights,
    { runs: 2000, seed: 42 },
  );

  const tableLabelVars = {
    "--label-2": `"${PREVIEW_SCORING_DATA.criteria[0]}"`,
    "--label-3": `"${PREVIEW_SCORING_DATA.criteria[1]}"`,
    "--label-4": `"${PREVIEW_SCORING_DATA.criteria[2]}"`,
    "--label-5": `"${PREVIEW_SCORING_DATA.criteria[3]}"`,
    "--label-6": '"Weighted Score"',
    "--label-7": '"First-Rank Prob."',
  } as CSSProperties;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-3 border-b border-[var(--border)] pb-6">
        <p className="text-sm font-medium tracking-wide text-[var(--accent)] uppercase">
          NASA Space Apps Challenge 2026 · Pilot: Ashanti Region, Ghana
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Field Shift
        </h1>
        <p className="max-w-3xl text-base leading-relaxed opacity-85">
          Evidence-graded crop-rotation decision support powered by NASA Earth
          observations. Compares a farmer&apos;s baseline rotation against
          candidate strategies with transparent priority weights, Monte Carlo
          rank stability, and explicit expert-review prompts.
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-10">
        <section aria-labelledby="architecture-heading" className="flex flex-col gap-4">
          <h2 id="architecture-heading" className="text-xl font-semibold">
            System Modules
          </h2>
          <div className="fs-card-grid">
            {ARCHITECTURE_LAYERS.map((layer) => (
              <article key={layer.title} className="fs-card">
                <h3 className="text-lg font-semibold">{layer.title}</h3>
                <p className="text-sm leading-relaxed opacity-85">
                  {layer.summary}
                </p>
                <footer>
                  <code>{layer.artifactPath}</code>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="comparison-heading" className="flex flex-col gap-4">
          <h2 id="comparison-heading" className="text-xl font-semibold">
            Baseline Scoring &amp; Rank-Stability Preview
          </h2>
          <p className="text-sm leading-relaxed opacity-85">
            Live output computed with <code>baseScores</code> and{" "}
            <code>rankProbabilities</code> from{" "}
            <code>shared/test-vectors/scoring_basic.json</code> (2,000 Monte
            Carlo runs; illustrative scores only, not agronomic recommendations).
          </p>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="strategy-table-caption"
            className="table-wrapper"
          >
            <table className="strategy-table" style={tableLabelVars}>
              <caption id="strategy-table-caption">
                Strategy comparison matrix (weights:{" "}
                {PREVIEW_SCORING_DATA.weights
                  .map((w, idx) => `${PREVIEW_SCORING_DATA.criteria[idx]} ${w.toFixed(1)}`)
                  .join(", ")}
                )
              </caption>
              <thead>
                <tr>
                  <th scope="col">Strategy</th>
                  {PREVIEW_SCORING_DATA.criteria.map((criterion) => (
                    <th key={criterion} scope="col">
                      {criterion}
                    </th>
                  ))}
                  <th scope="col">Weighted Score</th>
                  <th scope="col">First-Rank Prob.</th>
                </tr>
              </thead>
              <tbody>
                {PREVIEW_SCORING_DATA.strategies.map((strategy, sIdx) => (
                  <tr key={strategy}>
                    <th scope="row">{strategy}</th>
                    {PREVIEW_SCORING_DATA.scores[sIdx].map((val, cIdx) => (
                      <td key={PREVIEW_SCORING_DATA.criteria[cIdx]}>{val.toFixed(2)}</td>
                    ))}
                    <td className="font-mono font-semibold">
                      {computedBaseScores[sIdx].toFixed(3)}
                    </td>
                    <td className="font-mono">
                      {(stability.probabilityFirst[sIdx] * 100).toFixed(1)}%{" "}
                      <span className="text-xs opacity-75">
                        (mean rank {stability.meanRank[sIdx].toFixed(2)})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <summary className="cursor-pointer font-medium">
              Evidence Passport &amp; Scale-Honesty Note (Illustrative Fixture)
            </summary>
            <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed opacity-85">
              <p>
                <strong>Evidence tier:</strong> Unverified illustrative vector
                for Python/TypeScript parity verification.
              </p>
              <p>
                <strong>Required local review:</strong> Farmer priority weights,
                seed availability, disease cycles, and coarse satellite-pixel
                resolution relative to plot boundaries must be confirmed with a
                local extension officer or agronomist before acting.
              </p>
            </div>
          </details>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] pt-6 text-sm opacity-75">
        Field Shift · Decision support only — supports local agricultural
        expertise and never replaces it.
      </footer>
    </div>
  );
}
