/**
 * On-device plot soil-cover and crop-stress vision classifier.
 *
 * Runs 100% offline using Skia offscreen pixel readback + agronomic spectral
 * indices (ExG, NGRDI, residue/bare-soil separation). Structured behind a
 * backend-agnostic interface so a quantized ONNX / TFLite model can be swapped
 * in later without changing callers.
 */

export type SoilCoverClass = 'Intact' | 'Partial' | 'Bare';
export type WaterStressHint = 'None' | 'Mild' | 'Severe';
export type VisionBackendId = 'skia-agronomic-v1' | 'onnx-runtime' | 'tflite';

export interface PlotVisionPrediction {
  soilCover: SoilCoverClass;
  waterStressHint: WaterStressHint;
  canopyPct: number;
  mulchPct: number;
  barePct: number;
  confidence: number;
  backend: VisionBackendId;
  inferenceMs: number;
}

const PATCH_SIZE = 64;

/**
 * Classify an RGBA pixel buffer (e.g. 64x64 downsampled plot photo) into
 * canopy cover, mulch/residue cover, bare soil exposure, and chlorosis stress.
 */
export function classifyRgbaPatch(
  rgba: Uint8Array | Uint8ClampedArray | Float32Array,
  width: number,
  height: number,
): PlotVisionPrediction {
  const start = Date.now();
  const totalPixels = Math.max(1, Math.min(width * height, Math.floor(rgba.length / 4)));

  let canopyCount = 0;
  let chloroticVegCount = 0;
  let mulchCount = 0;
  let bareCount = 0;

  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    const rawR = rgba[offset] ?? 0;
    const rawG = rgba[offset + 1] ?? 0;
    const rawB = rgba[offset + 2] ?? 0;

    // Normalize to 0..1 whether buffer is 8-bit [0..255] or float [0..1]
    const scale = rawR > 1 || rawG > 1 || rawB > 1 ? 255 : 1;
    const r = rawR / scale;
    const g = rawG / scale;
    const b = rawB / scale;

    const sum = r + g + b;
    if (sum < 0.08) {
      // Deep shadow: treat neutrally as covered understory
      mulchCount++;
      continue;
    }

    // Excess Green Index (Woebbecke et al.): separates living green canopy
    const exg = 2 * g - r - b;
    // Normalized Green-Red Difference Index
    const ngrdi = (g - r) / Math.max(1e-4, g + r);

    if (exg > 0.06 && ngrdi > 0.0) {
      canopyCount++;
      // Yellowing / chlorotic vegetation shows weaker green dominance
      if (ngrdi < 0.08 && r > 0.32) {
        chloroticVegCount++;
      }
      continue;
    }

    // Dry mulch / straw / crop residue is brighter and warmer-neutral than dark/reddish bare soil
    const brightness = sum / 3;
    const rednessRatio = r / Math.max(1e-4, g + b);
    if (brightness > 0.45 && rednessRatio < 0.72) {
      mulchCount++;
    } else {
      bareCount++;
    }
  }

  const canopyPct = Math.round((canopyCount / totalPixels) * 100);
  const mulchPct = Math.round((mulchCount / totalPixels) * 100);
  const barePct = Math.max(0, 100 - canopyPct - mulchPct);
  const coverPct = canopyPct + mulchPct;

  let soilCover: SoilCoverClass = 'Partial';
  let margin = 0;
  if (coverPct >= 65) {
    soilCover = 'Intact';
    margin = (coverPct - 65) / 35;
  } else if (coverPct < 30) {
    soilCover = 'Bare';
    margin = (30 - coverPct) / 30;
  } else {
    soilCover = 'Partial';
    const distFromBoundary = Math.min(coverPct - 30, 65 - coverPct);
    margin = distFromBoundary / 17.5;
  }

  const chlorosisFraction =
    canopyCount > 0 ? chloroticVegCount / canopyCount : barePct / 100;
  let waterStressHint: WaterStressHint = 'None';
  if (chlorosisFraction > 0.45 || barePct > 75) {
    waterStressHint = 'Severe';
  } else if (chlorosisFraction > 0.2 || barePct > 45) {
    waterStressHint = 'Mild';
  }

  const confidence = Number(
    Math.min(0.96, Math.max(0.58, 0.64 + margin * 0.3)).toFixed(2),
  );

  return {
    soilCover,
    waterStressHint,
    canopyPct,
    mulchPct,
    barePct,
    confidence,
    backend: 'skia-agronomic-v1',
    inferenceMs: Math.max(1, Date.now() - start),
  };
}

/**
 * Decode a local image URI into an offscreen 64x64 Skia surface and run
 * on-device pixel classification with zero network calls.
 */
export async function classifyPlotImageUri(
  uri: string,
): Promise<PlotVisionPrediction | null> {
  try {
    const { Skia } = await import('@shopify/react-native-skia');
    const data = await Skia.Data.fromURI(uri);
    const image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) {
      return null;
    }

    const surface = Skia.Surface.MakeOffscreen(PATCH_SIZE, PATCH_SIZE);
    if (!surface) {
      return null;
    }

    const canvas = surface.getCanvas();
    const paint = Skia.Paint();
    canvas.drawImageRect(
      image,
      Skia.XYWHRect(0, 0, image.width(), image.height()),
      Skia.XYWHRect(0, 0, PATCH_SIZE, PATCH_SIZE),
      paint,
    );
    surface.flush();

    const snapshot = surface.makeImageSnapshot();
    const pixels = snapshot.readPixels(0, 0);
    if (!pixels) {
      return null;
    }

    return classifyRgbaPatch(pixels, PATCH_SIZE, PATCH_SIZE);
  } catch {
    return null;
  }
}
