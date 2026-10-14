import { describe, expect, it } from "vite-plus/test";
import {
  fromDateTimeInput,
  timestampAtPosition,
  toDateTimeInput,
  yearBounds,
  yearPosition,
  daysInYear,
  dayZoomRange,
  nextTwoHoursZoomRange,
  nextTenMinutesZoomRange,
  monthZoomRange,
  weekZoomRange,
} from "./year-time";

describe("year and timestamp contract", () => {
  it("zooms to the selected calendar month, including leap days", () => {
    const [start, end] = monthZoomRange(new Date(2024, 1, 20, 12).getTime());
    expect(toDateTimeInput(timestampAtPosition(start, 2024))).toBe("2024-02-01T00:00:00");
    expect(toDateTimeInput(timestampAtPosition(end, 2024))).toBe("2024-03-01T00:00:00");
  });

  it("zooms to Monday through Monday across New Year", () => {
    const [start, end] = weekZoomRange(new Date(2026, 0, 2, 12).getTime());
    expect(toDateTimeInput(timestampAtPosition(start, 2026, false))).toBe("2025-12-29T00:00:00");
    expect(toDateTimeInput(timestampAtPosition(end, 2026, false))).toBe("2026-01-05T00:00:00");
  });

  it("keeps a ten-minute window across New Year", () => {
    const timestamp = new Date(2026, 11, 31, 23, 55).getTime();
    const [start, end] = nextTenMinutesZoomRange(timestamp);
    expect(timestampAtPosition(start, 2026, false)).toBe(timestamp);
    expect(timestampAtPosition(end, 2026, false)).toBe(timestamp + 10 * 60_000);
  });
  it.each([
    [2026, 365],
    [2024, 366],
    [1900, 365],
    [2000, 366],
  ])("uses the calendar day count for %s", (year, days) => {
    expect(daysInYear(year!)).toBe(days);
  });
  it("zooms to local midnight through the next local midnight", () => {
    const timestamp = new Date(2026, 2, 29, 12).getTime();
    const [start, end] = dayZoomRange(timestamp);
    expect(toDateTimeInput(timestampAtPosition(start, 2026))).toBe("2026-03-29T00:00:00");
    expect(toDateTimeInput(timestampAtPosition(end, 2026))).toBe("2026-03-30T00:00:00");
  });

  it("keeps a two-hour window across New Year", () => {
    const timestamp = new Date(2026, 11, 31, 23).getTime();
    const [start, end] = nextTwoHoursZoomRange(timestamp);
    const bounds = yearBounds(2026);
    expect((end - start) * (bounds.end - bounds.start)).toBeCloseTo(2 * 60 * 60_000, 3);
    expect(start).toBeLessThan(1);
    expect(end).toBeGreaterThan(1);
  });
  it("starts at local January 1 and ends at the next January 1", () => {
    const { start, end } = yearBounds(2026);
    expect(toDateTimeInput(start)).toBe("2026-01-01T00:00:00");
    expect(toDateTimeInput(end)).toBe("2027-01-01T00:00:00");
    expect(yearPosition(start)).toBe(0);
    expect(timestampAtPosition(1, 2026)).toBe(end);
  });

  it.each([2024, 2026])("round-trips timestamps in year %s, including leap years", (year) => {
    const timestamp = new Date(year, 6, 12, 14, 35, 20).getTime();
    expect(timestampAtPosition(yearPosition(timestamp), year)).toBe(timestamp);
  });

  it("round-trips date/time input and rejects invalid dates", () => {
    const timestamp = new Date(2024, 1, 29, 12, 10, 5).getTime();
    expect(fromDateTimeInput(toDateTimeInput(timestamp))).toBe(timestamp);
    expect(fromDateTimeInput("2026-02-30T12:00:00")).toBeUndefined();
    expect(fromDateTimeInput("")).toBeUndefined();
  });

  it("clamps chart selections to the year", () => {
    const { start, end } = yearBounds(2026);
    expect(timestampAtPosition(-1, 2026)).toBe(start);
    expect(timestampAtPosition(2, 2026)).toBe(end);
  });
});
