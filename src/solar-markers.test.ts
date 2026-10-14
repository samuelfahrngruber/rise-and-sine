import { describe, expect, it } from "vite-plus/test";
import { seasonMarkers } from "./solar-markers";
import { timestampAtPosition, toDateTimeInput } from "./year-time";

describe("season marker contract", () => {
  it.each([2024, 2026])("places the four seasonal markers at local dates in %s", (year) => {
    const markers = seasonMarkers(year);
    expect(markers.every((marker) => marker.orientation === "vertical")).toBe(true);
    expect(
      markers.map((marker) =>
        toDateTimeInput(timestampAtPosition(marker.value, year)).slice(5, 10),
      ),
    ).toEqual(["03-21", "06-21", "09-23", "12-21"]);
  });
});
