"use client";

import { useState, useCallback, useMemo } from "react";
import { baseScores, rankProbabilities, RankProbabilityResult } from "@/lib/scoring";
import { PRIORITY_CRITERIA, type ExistingRotationInput } from "@/types/database";

const STRATEGY_NAMES = ["Existing Rotation", "Strategy A", "Strategy B"];
const CRITERIA_KEYS = PRIORITY_CRITERIA.map((c) => c.key);

const DEFAULT_SCORES: number[][] = [
  [0.55, 0.4, 0.5, 0.3],
  [0.7, 0.65, 0.6, 0.55],
  [0.6, 0.8, 0.75, 0.45],
];

const PILOT_CELLS = [
  { id: "cell-1", name: "Ashanti Pilot Cell 1", center_lat: 6.68, center_lon: -1.62, area_ha: 42.5 },
  { id: "cell-2", name: "Ashanti Pilot Cell 2", center_lat: 6.72, center_lon: -1.58, area_ha: 38.2 },
  { id: "cell-3", name: "Ashanti Pilot Cell 3", center_lat: 6.65, center_lon: -1.65, area_ha: 51.8 },
];

const SEASONS = ["2024 Major", "2024 Minor", "2025 Major", "2025 Minor"];

const CROP_OPTIONS = [
  "Maize",
  "Cassava",
  "Yam",
  "Plantain",
  "Rice",
  "Soybean",
  "Cowpea",
  "Groundnut",
  "Sorghum",
  "Millet",
];

function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  description,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}) {
  return (
    <div className="slider-group">
      <div className="slider-header">
        <label htmlFor={label.toLowerCase().replace(/\s+/g, "-")} className="slider-label">
          {label}
        </label>
        <span className="slider-value">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        id={label.toLowerCase().replace(/\s+/g, "-")}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input"
        aria-label={label}
      />
      {description && <p className="slider-description">{description}</p>}
    </div>
  );
}

function PilotCellSelector({
  selectedCell,
  onChange,
}: {
  selectedCell: string | null;
  onChange: (cellId: string) => void;
}) {
  return (
    <div className="input-group">
      <label htmlFor="pilot-cell" className="input-label">
        Pilot Cell
      </label>
      <select
        id="pilot-cell"
        value={selectedCell || ""}
        onChange={(e) => onChange(e.target.value)}
        className="input-select"
        aria-label="Select pilot cell"
      >
        <option value="">Select a pilot cell...</option>
        {PILOT_CELLS.map((cell) => (
          <option key={cell.id} value={cell.id}>
            {cell.name} ({cell.area_ha} ha)
          </option>
        ))}
      </select>
      <p className="input-description">
        Choose the 50×50 km pilot cell for analysis
      </p>
    </div>
  );
}

function SeasonSelector({
  selectedSeason,
  onChange,
}: {
  selectedSeason: string;
  onChange: (season: string) => void;
}) {
  return (
    <div className="input-group">
      <label htmlFor="season" className="input-label">
        Growing Season
      </label>
      <select
        id="season"
        value={selectedSeason}
        onChange={(e) => onChange(e.target.value)}
        className="input-select"
        aria-label="Select growing season"
      >
        {SEASONS.map((season) => (
          <option key={season} value={season}>
            {season}
          </option>
        ))}
      </select>
      <p className="input-description">
        Select the growing season for strategy evaluation
      </p>
    </div>
  );
}

function ExistingRotationInput({
  value,
  onChange,
}: {
  value: ExistingRotationInput;
  onChange: (input: ExistingRotationInput) => void;
}) {
  const handleCropChange = (index: number, crop: string) => {
    const newSequence = [...value.cropSequence];
    newSequence[index] = crop;
    onChange({ ...value, cropSequence: newSequence });
  };

  const addCrop = () => {
    onChange({ ...value, cropSequence: [...value.cropSequence, ""] });
  };

  const removeCrop = (index: number) => {
    const newSequence = value.cropSequence.filter((_, i) => i !== index);
    onChange({ ...value, cropSequence: newSequence });
  };

  return (
    <div className="input-group">
      <label className="input-label">Existing Rotation Baseline</label>
      <div className="rotation-inputs">
        <div className="rotation-row">
          <div className="input-subgroup">
            <label htmlFor="years-data" className="input-sublabel">Years of Data</label>
            <input
              id="years-data"
              type="number"
              min="1"
              max="50"
              value={value.yearsOfData}
              onChange={(e) => onChange({ ...value, yearsOfData: Number(e.target.value) || 1 })}
              className="input-number"
            />
          </div>
          <div className="input-subgroup">
            <label htmlFor="typical-yield" className="input-sublabel">Typical Yield (t/ha)</label>
            <input
              id="typical-yield"
              type="number"
              min="0"
              step="0.1"
              value={value.typicalYield ?? ""}
              onChange={(e) => onChange({ ...value, typicalYield: e.target.value ? Number(e.target.value) : null })}
              className="input-number"
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="rotation-row">
          <div className="input-subgroup">
            <label htmlFor="soil-condition" className="input-sublabel">Soil Condition</label>
            <select
              id="soil-condition"
              value={value.soilCondition}
              onChange={(e) => onChange({ ...value, soilCondition: e.target.value as ExistingRotationInput["soilCondition"] })}
              className="input-select"
            >
              <option value="poor">Poor</option>
              <option value="fair">Fair</option>
              <option value="good">Good</option>
              <option value="excellent">Excellent</option>
            </select>
          </div>
          <div className="input-subgroup">
            <label className="input-sublabel">Irrigation Access</label>
            <div className="toggle-wrapper">
              <input
                type="checkbox"
                id="irrigation-access"
                checked={value.irrigationAccess}
                onChange={(e) => onChange({ ...value, irrigationAccess: e.target.checked })}
                className="toggle-input"
              />
              <label htmlFor="irrigation-access" className="toggle-label">
                <span className="toggle-switch" />
                <span className="toggle-text">{value.irrigationAccess ? "Yes" : "No"}</span>
              </label>
            </div>
          </div>
        </div>
        <div className="crop-sequence">
          <div className="crop-sequence-header">
            <span className="input-sublabel">Crop Sequence (most recent first)</span>
            <button type="button" onClick={addCrop} className="btn btn-secondary btn-sm">
              + Add Crop
            </button>
          </div>
          {value.cropSequence.map((crop, index) => (
            <div key={index} className="crop-row">
              <select
                value={crop}
                onChange={(e) => handleCropChange(index, e.target.value)}
                className="input-select crop-select"
              >
                <option value="">Select crop...</option>
                {CROP_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {value.cropSequence.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCrop(index)}
                  className="btn btn-ghost btn-sm remove-btn"
                  aria-label="Remove crop"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="input-subgroup full-width">
          <label htmlFor="rotation-notes" className="input-sublabel">Notes</label>
          <textarea
            id="rotation-notes"
            value={value.notes}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            className="input-textarea"
            rows={3}
            placeholder="Additional context about current rotation..."
          />
        </div>
      </div>
    </div>
  );
}

function PrioritySliders({
  weights,
  onChange,
}: {
  weights: Record<string, number>;
  onChange: (weights: Record<string, number>) => void;
}) {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  return (
    <div className="input-group">
      <div className="input-group-header">
        <label className="input-label">Priority Sliders</label>
        <div className="weight-sum">
          Total: {Math.round(totalWeight * 100)}%
          {totalWeight > 0 && totalWeight < 0.99 && <span className="weight-warning"> (normalized)</span>}
          {totalWeight > 1.01 && <span className="weight-warning"> (will normalize)</span>}
        </div>
      </div>
      <p className="input-description">
        Adjust priorities to reflect your farming objectives. Weights are normalized automatically.
      </p>
      <div className="sliders-container">
        {PRIORITY_CRITERIA.map((criterion) => (
          <Slider
            key={criterion.key}
            label={criterion.label}
            value={weights[criterion.key] || 0}
            onChange={(value) =>
              onChange({ ...weights, [criterion.key]: value })
            }
            description={criterion.description}
          />
        ))}
      </div>
      <div className="weight-actions">
        <button
          type="button"
          onClick={() =>
            onChange(
              PRIORITY_CRITERIA.reduce(
                (acc, c) => ({ ...acc, [c.key]: c.defaultWeight }),
                {} as Record<string, number>,
              ),
            )
          }
          className="btn btn-secondary btn-sm"
        >
          Reset to Defaults
        </button>
        <button
          type="button"
          onClick={() =>
            onChange(
              PRIORITY_CRITERIA.reduce(
                (acc, c) => ({ ...acc, [c.key]: 1 / PRIORITY_CRITERIA.length }),
                {} as Record<string, number>,
              ),
            )
          }
          className="btn btn-secondary btn-sm"
        >
          Equal Weights
        </button>
      </div>
    </div>
  );
}

function ResultsPanel({
  scores,
  weights,
  rankProbabilities,
}: {
  scores: number[];
  weights: number[];
  rankProbabilities: RankProbabilityResult;
}) {
  const normalizedWeights = useMemo(() => {
    const sum = weights.reduce((a, b) => a + b, 0);
    return sum > 0 ? weights.map((w) => w / sum) : weights;
  }, [weights]);

  return (
    <div className="results-panel">
      <h3 className="results-title">Strategy Scores & Rank Probabilities</h3>
      <div className="criteria-weights">
        {CRITERIA_KEYS.map((key, idx) => (
          <span key={key} className="criteria-weight-tag">
            {PRIORITY_CRITERIA[idx].label}: {Math.round(normalizedWeights[idx] * 100)}%
          </span>
        ))}
      </div>
      <table className="results-table" role="table">
        <thead>
          <tr>
            <th scope="col">Strategy</th>
            <th scope="col">Base Score</th>
            <th scope="col">Prob. Rank 1</th>
            <th scope="col">Mean Rank</th>
          </tr>
        </thead>
        <tbody>
          {STRATEGY_NAMES.map((name, idx) => (
            <tr key={name}>
              <td>
                <span className="strategy-name">
                  {name} {idx === 0 && <span className="baseline-badge">Baseline</span>}
                </span>
              </td>
              <td>
                <span className="score-value">{scores[idx].toFixed(3)}</span>
              </td>
              <td>
                <div className="probability-bar">
                  <div
                    className="probability-fill"
                    style={{ width: `${rankProbabilities.probabilityFirst[idx] * 100}%` }}
                  />
                  <span className="probability-text">
                    {Math.round(rankProbabilities.probabilityFirst[idx] * 100)}%
                  </span>
                </div>
              </td>
              <td>
                <span className="mean-rank">{rankProbabilities.meanRank[idx].toFixed(2)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="results-note">
        <p>
          <strong>Monte Carlo Simulation:</strong> 2,000 runs with 10% score uncertainty and 10% weight uncertainty.
          Probabilities show how often each strategy ranks first under parameter variation.
        </p>
      </div>
    </div>
  );
}

export function FarmContextPriorityInput() {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>(SEASONS[0]);
  const [existingRotation, setExistingRotation] = useState<ExistingRotationInput>({
    cropSequence: ["Maize", "Cassava"],
    yearsOfData: 5,
    typicalYield: 2.8,
    soilCondition: "fair",
    irrigationAccess: false,
    notes: "",
  });
  const [priorityWeights, setPriorityWeights] = useState<Record<string, number>>(
    PRIORITY_CRITERIA.reduce(
      (acc, c) => ({ ...acc, [c.key]: c.defaultWeight }),
      {} as Record<string, number>,
    ),
  );

  const weightsArray = useMemo(
    () => CRITERIA_KEYS.map((key) => priorityWeights[key] || 0),
    [priorityWeights],
  );

  const computedScores = useMemo(
    () => baseScores(DEFAULT_SCORES, weightsArray),
    [weightsArray],
  );

  const computedRankProbabilities = useMemo(
    () => rankProbabilities(DEFAULT_SCORES, weightsArray, { runs: 2000, seed: 42 }),
    [weightsArray],
  );

  const handleWeightChange = useCallback(
    (newWeights: Record<string, number>) => {
      setPriorityWeights(newWeights);
    },
    [],
  );

  return (
    <section className="farm-context-section section" aria-labelledby="farm-context-heading">
      <div className="container">
        <div className="section-header">
          <span className="label">Decision Input</span>
          <div className="section-divider" />
          <h2 id="farm-context-heading" className="display-lg">
            Farm Context & Priority Input
          </h2>
          <p className="body-lg">
            Define your farm context, existing rotation, and decision priorities to
            generate personalized strategy rankings with Monte Carlo confidence.
          </p>
        </div>

        <div className="farm-context-grid">
          <div className="input-panel">
            <PilotCellSelector selectedCell={selectedCell} onChange={setSelectedCell} />
            <SeasonSelector selectedSeason={selectedSeason} onChange={setSelectedSeason} />
            <ExistingRotationInput value={existingRotation} onChange={setExistingRotation} />
            <PrioritySliders weights={priorityWeights} onChange={handleWeightChange} />
          </div>

          <div className="results-panel-wrapper">
            <ResultsPanel
              scores={computedScores}
              weights={weightsArray}
              rankProbabilities={computedRankProbabilities}
            />
          </div>
        </div>
      </div>
    </section>
  );
}