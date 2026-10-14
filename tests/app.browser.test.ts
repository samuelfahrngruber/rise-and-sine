/// <reference types="vite-plus/test/browser-playwright" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { createApp, nextTick, type App as VueApp } from "vue";
import App from "../src/App.vue";
import "../src/style.css";

let app: VueApp;
let host: HTMLDivElement;

beforeEach(async () => {
  vi.setSystemTime(new Date("2026-06-21T12:00:00+02:00"));
  host = document.createElement("div");
  document.body.append(host);
  app = createApp(App);
  app.mount(host);
  await nextTick();
});

afterEach(() => {
  app.unmount();
  host.remove();
  vi.useRealTimers();
});

function input(selector: string): HTMLInputElement {
  return host.querySelector<HTMLInputElement>(selector)!;
}

function setRange(label: string, value: number): void {
  const slider = page.getByRole("slider", { name: label }).element() as HTMLInputElement;
  slider.value = String(value);
  slider.dispatchEvent(new Event("input", { bubbles: true }));
}

function plotPixels(): string {
  return host.querySelector("canvas")!.toDataURL();
}

function elevationText(): string {
  return host.querySelector("output")!.textContent!;
}

function plotOverlay(): HTMLElement {
  return host.querySelector<HTMLElement>(".u-over")!;
}

function hasMarkerColor(position: number, angle: number, color: [number, number, number]): boolean {
  const canvas = host.querySelector("canvas")!;
  const canvasBounds = canvas.getBoundingClientRect();
  const bounds = plotOverlay().getBoundingClientRect();
  const ratio = canvas.width / canvasBounds.width;
  const x = Math.round((bounds.left - canvasBounds.left + position * bounds.width) * ratio);
  const y = Math.round(
    (bounds.top - canvasBounds.top + ((90 - angle) / 180) * bounds.height) * ratio,
  );
  const pixels = canvas.getContext("2d")!.getImageData(x - 5, y - 5, 11, 11).data;
  for (let index = 0; index < pixels.length; index += 4) {
    if (
      color.every((value, channel) => Math.abs(pixels[index + channel]! - value) < 3) &&
      pixels[index + 3]! > 20
    )
      return true;
  }
  return false;
}

async function waitForDraw(): Promise<void> {
  await nextTick();
  await new Promise(requestAnimationFrame);
}

describe("solar UI", () => {
  it("syncs latitude inputs and updates the displayed angle and plot", async () => {
    const before = plotPixels();
    const angle = elevationText();
    expect(input('input[type="number"]').valueAsNumber).toBe(48.2082);
    expect(input('input[aria-label="Latitude"]').valueAsNumber).toBe(48.2082);

    await page.getByRole("spinbutton", { name: "Degrees north" }).fill("0");
    await waitForDraw();
    expect(input('input[aria-label="Latitude"]').valueAsNumber).toBe(0);
    expect(elevationText()).not.toBe(angle);
    expect(plotPixels()).not.toBe(before);

    setRange("Latitude", -33.5);
    await waitForDraw();
    expect(input('input[type="number"]').valueAsNumber).toBe(-33.5);
    expect(plotPixels()).not.toBe(before);
  });

  it("syncs date/time selection with the year, readout, and marker", async () => {
    const before = plotPixels();
    const dateTime = page.getByLabelText("Local time (Europe/Vienna)");
    await dateTime.fill("2024-12-21T23:00");
    await waitForDraw();
    await expect.element(page.getByText("Sun elevation in 2024")).toBeVisible();
    expect(input('input[type="datetime-local"]').value).toContain("2024-12-21T23:00");
    expect(elevationText()).toMatch(/Sun angle: -/);
    expect(plotPixels()).not.toBe(before);

    await page.getByRole("button", { name: "Now", exact: true }).click();
    await waitForDraw();
    expect(input('input[type="datetime-local"]').value).toContain("2026-06-21T12:00");
    await expect.element(page.getByText("Sun elevation in 2026")).toBeVisible();
  });

  it("selects a timestamp by clicking the plot", async () => {
    const overlay = plotOverlay();
    const { width, height } = overlay.getBoundingClientRect();
    const before = plotPixels();
    await page.elementLocator(overlay).click({ position: { x: width / 4, y: height / 2 } });
    await waitForDraw();
    expect(Number(elevationText().split("Year position: ")[1])).toBeCloseTo(0.25, 2);
    expect(input('input[type="datetime-local"]').value).toContain("2026-04-02");
    expect(plotPixels()).not.toBe(before);
    expect(hasMarkerColor(0.25, 80, [31, 119, 180])).toBe(true);
  });

  it("toggles the legend and spans the available window width", async () => {
    const legend = host.querySelector<HTMLElement>(".u-legend")!;
    expect(getComputedStyle(legend).display).not.toBe("none");
    await page.getByRole("checkbox", { name: "Show legend" }).click();
    await expect.poll(() => getComputedStyle(legend).display).toBe("none");
    await page.getByRole("checkbox", { name: "Show legend" }).click();
    await expect.poll(() => getComputedStyle(legend).display).not.toBe("none");
    const plot = page.getByRole("img", { name: "Function plot" }).element();
    expect(plot.getBoundingClientRect().width).toBeCloseTo(document.documentElement.clientWidth, 0);
  });

  it("advances playback at the chosen speed and stops when paused", async () => {
    const initial = elevationText();
    const initialTime = input('input[type="datetime-local"]').value;
    setRange("Playback speed", 100);
    await page.getByRole("switch", { name: "Live play" }).click();
    await expect.poll(() => input('input[type="datetime-local"]').value).not.toBe(initialTime);
    await expect.poll(elevationText).not.toBe(initial);
    await page.getByRole("switch", { name: "Live play" }).click();
    const paused = elevationText();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(elevationText()).toBe(paused);
    await page.getByRole("button", { name: "Real time (1×)" }).click();
    expect(input('input[aria-label="Playback speed"]').valueAsNumber).toBe(1);
    setRange("Playback speed", 0.5);
    await nextTick();
    await expect.element(page.getByText("Speed: 0.5×")).toBeVisible();
  });

  it("draws seasonal, horizon, and annual limit markers and the formula", async () => {
    const start = new Date(2026, 0, 1).getTime();
    const end = new Date(2027, 0, 1).getTime();
    for (const [month, day] of [
      [2, 21],
      [5, 21],
      [8, 23],
      [11, 21],
    ]) {
      const position = (new Date(2026, month!, day).getTime() - start) / (end - start);
      expect(hasMarkerColor(position, 80, [102, 102, 102])).toBe(true);
    }
    expect(hasMarkerColor(0.15, 0, [0, 0, 0])).toBe(true);
    expect(hasMarkerColor(0.15, 65.25, [44, 160, 44])).toBe(true);
    expect(hasMarkerColor(0.65, -65.25, [214, 39, 40])).toBe(true);
    const math = host.querySelector("math");
    expect(math).not.toBeNull();
    await expect.element(page.getByRole("link", { name: "NOAA formula" })).toBeVisible();
    await page.getByText("Full formula and daily limits").click();
    await expect.element(page.getByText(/Daily maximum = 90°/)).toBeVisible();
  });

  it("does not change the timestamp when dragging horizontally or vertically", async () => {
    const overlay = plotOverlay();
    const locator = page.elementLocator(overlay);
    const { width, height } = overlay.getBoundingClientRect();
    const selectedTime = input('input[type="datetime-local"]').value;
    const before = plotPixels();
    await userEvent.dragAndDrop(locator, locator, {
      sourcePosition: { x: width * 0.2, y: height * 0.5 },
      targetPosition: { x: width * 0.4, y: height * 0.5 },
    });
    await waitForDraw();
    expect(input('input[type="datetime-local"]').value).toBe(selectedTime);
    expect(plotPixels()).not.toBe(before);
    const zoomed = plotPixels();
    await userEvent.dragAndDrop(locator, locator, {
      sourcePosition: { x: width * 0.5, y: height * 0.2 },
      targetPosition: { x: width * 0.5, y: height * 0.8 },
    });
    await waitForDraw();
    expect(input('input[type="datetime-local"]').value).toBe(selectedTime);
    expect(plotPixels()).toBe(zoomed);
  });
});
