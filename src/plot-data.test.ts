import { describe, expect, it } from "vite-plus/test";
import { validatePlotData, type PlotData } from "./plot-data";

describe("plot data contract", () => {
  it("accepts multiple named series on a shared x axis", () => {
    expect(() =>
      validatePlotData({
        x: [0, 1, 2],
        series: [
          { label: "first", values: [0, 1, 0] },
          { label: "second", values: [1, 0, -1], color: "red" },
        ],
      }),
    ).not.toThrow();
  });

  it.each<PlotData>([
    { x: [0], series: [{ label: "y", values: [0] }] },
    { x: [0, 0], series: [{ label: "y", values: [0, 1] }] },
    { x: [1, 0], series: [{ label: "y", values: [0, 1] }] },
    { x: [0, Infinity], series: [{ label: "y", values: [0, 1] }] },
    { x: [0, 1], series: [] },
    { x: [0, 1], series: [{ label: "y", values: [0] }] },
    { x: [0, 1], series: [{ label: "y", values: [0, NaN] }] },
  ])("rejects invalid plot data: %j", (data) => {
    expect(() => validatePlotData(data)).toThrow(RangeError);
  });
});
