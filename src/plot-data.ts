export interface PlotSeries {
  label: string;
  values: number[];
  color?: string;
}

export interface PlotData {
  // Each series must match the shared, strictly ascending x values.
  x: number[];
  series: PlotSeries[];
}

export interface PlotMarker {
  orientation: "vertical" | "horizontal";
  value: number;
  color?: string;
  label?: string;
}

export function validatePlotData(data: PlotData): void {
  if (
    data.x.length < 2 ||
    data.x.some(
      (value, index) => !Number.isFinite(value) || (index > 0 && value <= data.x[index - 1]!),
    )
  ) {
    throw new RangeError("Use at least two finite, strictly ascending x values.");
  }

  if (
    data.series.length === 0 ||
    data.series.some(
      (series) =>
        series.values.length !== data.x.length ||
        series.values.some((value) => !Number.isFinite(value)),
    )
  ) {
    throw new RangeError("Each series must have a finite value for every x value.");
  }
}
