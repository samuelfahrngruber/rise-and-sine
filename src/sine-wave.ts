import type { PlotData } from "./plot-data";

export function createSineWave(sampleCount = 361): PlotData {
  if (!Number.isInteger(sampleCount) || sampleCount < 2) {
    throw new RangeError("Use at least two samples.");
  }

  const x = Array.from(
    { length: sampleCount },
    (_, index) => (index / (sampleCount - 1)) * 2 * Math.PI,
  );

  return { x, y: x.map((value) => Math.sin(value)) };
}
