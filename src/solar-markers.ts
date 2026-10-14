import type { PlotMarker } from "./plot-data";
import { yearBounds } from "./year-time";

export function seasonMarkers(year: number): PlotMarker[] {
  const { start, end } = yearBounds(year);
  // Approximate equinox and solstice dates; exact instants vary by year.
  return [
    { month: 2, day: 21, label: "21 Mar · Equinox" },
    { month: 5, day: 21, label: "21 Jun · Solstice" },
    { month: 8, day: 23, label: "23 Sep · Equinox" },
    { month: 11, day: 21, label: "21 Dec · Solstice" },
  ].map(({ month, day, label }) => ({
    orientation: "vertical",
    value: (new Date(year, month, day).getTime() - start) / (end - start),
    label,
  }));
}
