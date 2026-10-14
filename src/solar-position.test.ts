import { describe, expect, it } from "vite-plus/test";
import {
  sampleSolarYear,
  solarYearPlot,
  sunElevation,
  sunHourAngle,
  sunDeclination,
  solarTime,
  EARTH_TILT,
  VIENNA_LATITUDE,
} from "./solar-position";
import { validatePlotData } from "./plot-data";

describe("sun elevation contract", () => {
  it("defines UTC minutes including seconds", () => {
    expect(solarTime(Date.UTC(2026, 5, 21, 12, 30)).minutes).toBe(750);
    expect(solarTime(Date.UTC(2026, 5, 21, 0, 0, 30)).minutes).toBe(0.5);
  });

  it("uses axial tilt with zero declination at the reference equinox", () => {
    expect(sunDeclination(Date.UTC(2026, 2, 21, 12))).toBeCloseTo(0);
    expect(Math.abs(sunDeclination(Date.UTC(2026, 5, 21, 12)))).toBeLessThanOrEqual(EARTH_TILT);
    expect(sunHourAngle(Date.UTC(2026, 5, 21, 12), 0)).toBe(0);
  });

  it("exposes the seasonal declination in degrees", () => {
    expect(sunDeclination(Date.UTC(2026, 5, 21, 12))).toBeGreaterThan(23);
    expect(sunDeclination(Date.UTC(2026, 11, 21, 12))).toBeLessThan(-23);
  });

  it("applies a new longitude to cached yearly samples", () => {
    const samples = sampleSolarYear(2026, 0);
    const east = solarYearPlot(samples, VIENNA_LATITUDE, 90);
    const west = solarYearPlot(samples, VIENNA_LATITUDE, -90);
    const start = new Date(2026, 0, 1).getTime();
    const end = new Date(2027, 0, 1).getTime();
    const index = 172 * 1440 + 12 * 60;
    const timestamp = start + samples.x[index]! * (end - start);
    expect(east.series[0]!.values[index]).toBeCloseTo(
      sunElevation(timestamp, VIENNA_LATITUDE, 90),
      8,
    );
    expect(west.series[0]!.values[index]).toBeCloseTo(
      sunElevation(timestamp, VIENNA_LATITUDE, -90),
      8,
    );
    expect(east.series[0]!.values[index]).not.toBeCloseTo(west.series[0]!.values[index], 2);
    expect(east.series[1]!.values).toEqual(west.series[1]!.values);
    expect(east.series[2]!.values).toEqual(west.series[2]!.values);
  });
  it("measures hour angle from solar noon and shifts it with longitude", () => {
    const timestamp = Date.UTC(2026, 5, 21, 12);
    expect(Math.abs(sunHourAngle(timestamp, 0))).toBeLessThan(2);
    expect(sunHourAngle(timestamp, 30) - sunHourAngle(timestamp, 0)).toBeCloseTo(30);
  });
  it("gives Vienna's expected summer and winter daytime angles", () => {
    expect(sunElevation(Date.UTC(2026, 5, 21, 11), VIENNA_LATITUDE)).toBeCloseTo(65.2, 0);
    expect(sunElevation(Date.UTC(2026, 11, 21, 11), VIENNA_LATITUDE)).toBeCloseTo(18.4, 0);
  });

  it("places the sun below the horizon at night in Vienna", () => {
    expect(sunElevation(Date.UTC(2026, 5, 21, 23), VIENNA_LATITUDE)).toBeLessThan(0);
  });

  it("is independent of longitude at either pole", () => {
    const time = Date.UTC(2026, 5, 21, 12);
    expect(sunElevation(time, 90, 0)).toBeCloseTo(sunElevation(time, 90, 120));
    expect(sunElevation(time, -90)).toBeCloseTo(-sunElevation(time, 90));
  });

  it("shifts solar time with longitude", () => {
    const noon = Date.UTC(2026, 2, 20, 12);
    expect(sunElevation(noon, 0, 0)).toBeGreaterThan(85);
    expect(sunElevation(noon, 0, 180)).toBeLessThan(-85);
  });

  it.each([2024, 2026])("plots a complete year %s within daily extrema", (year) => {
    const samples = sampleSolarYear(year);
    const data = solarYearPlot(samples, VIENNA_LATITUDE);
    expect(() => validatePlotData(data)).not.toThrow();
    expect(data.x[0]).toBe(0);
    expect(data.x.at(-1)).toBe(1);
    const minutes = (new Date(year + 1, 0, 1).getTime() - new Date(year, 0, 1).getTime()) / 60_000;
    expect(data.x).toHaveLength(minutes + 1);
    expect(data.x[1]).toBeCloseTo(1 / minutes, 12);
    const [actual, maximum, minimum] = data.series;
    expect(
      actual!.values.every(
        (value, index) =>
          value <= maximum!.values[index]! + 1e-8 && value >= minimum!.values[index]! - 1e-8,
      ),
    ).toBe(true);
    expect(solarYearPlot(samples, -VIENNA_LATITUDE).series[1]!.values).not.toEqual(maximum!.values);
  });

  it("includes minute samples beyond New Year for a two-hour zoom", () => {
    const data = sampleSolarYear(2026, 16.3738, 120);
    expect(data.x).toHaveLength(365 * 1440 + 241);
    expect(data.x[0]).toBeLessThan(0);
    expect(data.x.at(-1)).toBeGreaterThan(1);
  });
});
