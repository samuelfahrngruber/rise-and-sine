import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { effectScope, ref, type EffectScope } from "vue";
import { usePlayback } from "./use-playback";

let scope: EffectScope;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
  scope = effectScope();
});
afterEach(() => {
  scope.stop();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("playback contract", () => {
  it("advances by elapsed time at the selected speed and pauses", () => {
    const timestamp = ref(1000);
    const playing = ref(false);
    const speed = ref(1);
    scope.run(() => usePlayback(timestamp, playing, speed));
    vi.advanceTimersByTime(16);
    expect(timestamp.value).toBe(1000);
    playing.value = true;
    vi.advanceTimersByTime(16);
    expect(timestamp.value).toBe(1016);
    speed.value = 100;
    vi.advanceTimersByTime(16);
    expect(timestamp.value).toBe(2616);
    playing.value = false;
    vi.advanceTimersByTime(1000);
    expect(timestamp.value).toBe(2616);
  });

  it("supports half-speed, timestamp selection, and cleanup", () => {
    const timestamp = ref(0);
    const playing = ref(true);
    scope.run(() => usePlayback(timestamp, playing, ref(0.5)));
    vi.advanceTimersByTime(16);
    expect(timestamp.value).toBe(8);
    timestamp.value = 2000;
    vi.advanceTimersByTime(16);
    expect(timestamp.value).toBe(2008);
    scope.stop();
    vi.advanceTimersByTime(1000);
    expect(timestamp.value).toBe(2008);
  });
});
