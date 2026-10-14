import { describe, expect, it } from "vite-plus/test";
import { createSineWave } from "./sine-wave";

describe("createSineWave", () => {
  it("covers one full cycle with matching, ascending columns", () => {
    const { x, y } = createSineWave();

    expect(x.length).toBeGreaterThanOrEqual(2);
    expect(y).toHaveLength(x.length);
    expect(x[0]).toBe(0);
    expect(x.at(-1)).toBeCloseTo(2 * Math.PI);
    expect(x.every((value, index) => index === 0 || value > x[index - 1]!)).toBe(true);
    expect(y.every((value) => value >= -1 && value <= 1)).toBe(true);
  });

  it("passes through the sine wave's zeros and extrema", () => {
    const { y } = createSineWave(5);

    [0, 1, 0, -1, 0].forEach((expected, index) => {
      expect(y[index]).toBeCloseTo(expected);
    });
  });

  it.each([0, 1, 2.5, NaN, Infinity])("rejects an invalid sample count: %s", (count) => {
    expect(() => createSineWave(count)).toThrow(RangeError);
  });
});
