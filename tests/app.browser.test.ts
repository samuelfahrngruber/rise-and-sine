/// <reference types="vite-plus/test/browser-playwright" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { createApp, nextTick, type App as VueApp } from "vue";
import App from "../src/App.vue";
import AccuratePage from "../src/AccuratePage.vue";
import "../src/style.css";

let app: VueApp;
let host: HTMLDivElement;

beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ features: [] }))),
  );
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
  vi.unstubAllGlobals();
});

function locationResponse(name: string, latitude: number, longitude: number): Response {
  return new Response(
    JSON.stringify({
      features: [
        {
          geometry: { coordinates: [longitude, latitude] },
          properties: { name, country: "Austria" },
        },
      ],
    }),
  );
}

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

function selectedYearPosition(): number {
  return input('input[type="number"][min="0"]').valueAsNumber;
}

function plotOverlay(): HTMLElement {
  return host.querySelector<HTMLElement>(".u-over")!;
}

function hasMarkerColor(
  position: number,
  angle: number,
  color: [number, number, number],
  verticalRadius = 5,
): boolean {
  const canvas = host.querySelector("canvas")!;
  const canvasBounds = canvas.getBoundingClientRect();
  const bounds = plotOverlay().getBoundingClientRect();
  const ratio = canvas.width / canvasBounds.width;
  const x = Math.round((bounds.left - canvasBounds.left + position * bounds.width) * ratio);
  const y = Math.round(
    (bounds.top - canvasBounds.top + ((90 - angle) / 180) * bounds.height) * ratio,
  );
  const pixels = canvas
    .getContext("2d")!
    .getImageData(x - 5, y - verticalRadius, 11, 2 * verticalRadius + 1).data;
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
  it("waits for Search and syncs the chosen place with coordinates and the chart", async () => {
    const fetchMock = vi.fn(async () => locationResponse("Vienna", 48.2084, 16.3725));
    vi.stubGlobal("fetch", fetchMock);
    const before = plotPixels();
    const search = page.getByRole("searchbox", { name: "Location name" });
    await search.fill("vie");
    await search.fill("vienna");
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(fetchMock).not.toHaveBeenCalled();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect
      .element(page.getByRole("button", { name: "Vienna, Austria", exact: true }))
      .toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await page.getByRole("button", { name: "Vienna, Austria", exact: true }).click();
    await waitForDraw();
    expect(input('input[type="search"]').value).toBe("Vienna, Austria");
    expect(input('input[type="number"][min="-90"]').valueAsNumber).toBe(48.2084);
    expect(input('input[type="number"][min="-180"]').valueAsNumber).toBe(16.3725);
    expect(input('input[aria-label="Latitude (φ)"]').valueAsNumber).toBeCloseTo(48.2084, 4);
    expect(input('input[aria-label="Longitude (λ)"]').valueAsNumber).toBeCloseTo(16.3725, 4);
    expect(plotPixels()).not.toBe(before);
  });

  it("debounces coordinate changes and shows the nearby place without moving the point", async () => {
    const fetchMock = vi.fn(async () => locationResponse("Graz", 47.07, 15.44));
    vi.stubGlobal("fetch", fetchMock);
    setRange("Latitude (φ)", 47.1);
    setRange("Longitude (λ)", 15.5);
    await nextTick();
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(input('input[type="search"]').value).toBe("Graz, Austria"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(input('input[type="number"][min="-90"]').valueAsNumber).toBe(47.1);
    expect(input('input[type="number"][min="-180"]').valueAsNumber).toBe(15.5);
  });

  it("ignores stale location responses after the coordinates change", async () => {
    let resolveSearch!: (response: Response) => void;
    const pendingSearch = new Promise<Response>((resolve) => {
      resolveSearch = resolve;
    });
    const fetchMock = vi.fn<typeof fetch>(async (url) =>
      (url instanceof URL
        ? url.pathname
        : new URL(url instanceof Request ? url.url : url).pathname) === "/api/"
        ? pendingSearch
        : locationResponse("Graz", 47.07, 15.44),
    );
    vi.stubGlobal("fetch", fetchMock);
    await page.getByRole("searchbox", { name: "Location name" }).fill("vienna");
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await page.getByRole("spinbutton", { name: "Degrees north (φ)" }).fill("47.1");
    resolveSearch(locationResponse("Vienna", 48.2084, 16.3725));
    await vi.waitFor(() => expect(input('input[type="search"]').value).toBe("Graz, Austria"));
    expect(host.querySelector('[aria-label="Location results"]')).toBeNull();
    expect(input('input[type="number"][min="-90"]').valueAsNumber).toBe(47.1);
  });

  it("shows empty and unavailable search results while keeping coordinates usable", async () => {
    const search = page.getByRole("searchbox", { name: "Location name" });
    await search.fill("unknown");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect.element(page.getByRole("status")).toHaveTextContent("No locations found.");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503 })),
    );
    await search.fill("vienna");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("Location lookup unavailable. Try again.");
    await page.getByRole("spinbutton", { name: "Degrees north (φ)" }).fill("0");
    await waitForDraw();
    expect(input('input[aria-label="Latitude (φ)"]').valueAsNumber).toBe(0);
  });

  it("shows 365 or 366 daily rotations as the selected year changes", async () => {
    const equation = () => host.querySelector('math[aria-label="Solar hour angle equation"]')!;
    expect(equation().textContent).toContain("365");
    expect(equation().textContent).not.toMatch(/720|1440|mod/);
    await page.getByLabelText("Local time (t, Europe/Vienna)").fill("2024-06-21T12:00");
    await waitForDraw();
    expect(equation().textContent).toContain("366");
    await page.getByLabelText("Local time (t, Europe/Vienna)").fill("2025-06-21T12:00");
    await waitForDraw();
    expect(equation().textContent).toContain("365");
  });

  it("leaves accurate mode as future instructions without controls or a chart", async () => {
    app.unmount();
    app = createApp(AccuratePage);
    app.mount(host);
    await nextTick();
    expect(page.getByRole("heading", { name: "Accurate mode" }).element()).toBeVisible();
    expect(page.getByText("Add observer altitude.").element()).toBeVisible();
    expect(page.getByRole("link", { name: "Back to approximate mode" }).element()).toHaveAttribute(
      "href",
      "../",
    );
    expect(host.querySelector("canvas")).toBeNull();
    expect(host.querySelector("input")).toBeNull();
  });

  it("defines the solar functions beneath the main equation and illustrates every symbol", async () => {
    const main = host.querySelector("math")!;
    for (const label of ["Solar declination equation", "Solar hour angle equation"]) {
      const equation = host.querySelector(`math[aria-label="${label}"]`)!;
      expect(equation).not.toBeNull();
      expect(
        main.compareDocumentPosition(equation) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    for (const name of [
      "Latitude φ illustration",
      "Longitude λ illustration",
      "Year position t illustration",
      "Sun angle α illustration",
      "Solar declination δ(t) illustration",
      "Solar hour angle H(λ, t) illustration",
      "Start rotation θ₀ illustration",
      "Earth tilt ε illustration",
      "Reference equinox tₑ illustration",
    ]) {
      expect(page.getByRole("img", { name }).element()).toBeVisible();
    }
    const accurate = page.getByRole("link", { name: "Accurate", exact: true });
    expect(accurate.element()).toHaveAttribute("href", "./accurate/");
    expect(accurate.element().closest("header")).toBe(
      page.getByRole("heading", { name: "Rise and Sine" }).element().closest("header"),
    );
    expect(host.querySelector('math[aria-label="Equation of time definition"]')).toBeNull();
    expect(
      host.querySelector('math[aria-label="Solar declination equation"]')!.textContent,
    ).toContain("ε");
    const correction = page
      .getByRole("img", { name: "Solar declination δ(t) illustration" })
      .element();
    const before = correction.querySelector("circle")!.getAttribute("cx");
    await page.getByRole("spinbutton", { name: "Year position (t)" }).fill("0.75");
    await waitForDraw();
    expect(correction.querySelector("circle")!.getAttribute("cx")).not.toBe(before);

    const cards = host.querySelectorAll('section[aria-label="Sun angle formula"] figure');
    expect(cards).toHaveLength(9);
    for (const card of cards) {
      expect(card.querySelector("svg")).not.toBeNull();
      expect(card.querySelector("figcaption")!.textContent).not.toBe("");
      expect(card.querySelector("p")!.textContent).not.toBe("");
      expect(main.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(host.querySelector('[aria-label="Playback speed v illustration"]')).toBeNull();
    expect(host.textContent).not.toContain("Angle inputs use degrees");
  });
  it("syncs longitude controls and updates the curve while keeping the selected time and zoom", async () => {
    const number = page.getByRole("spinbutton", { name: "Degrees east (λ)" });
    const slider = page.getByRole("slider", { name: "Longitude (λ)" });
    expect((number.element() as HTMLInputElement).valueAsNumber).toBe(16.3738);
    expect((slider.element() as HTMLInputElement).valueAsNumber).toBe(16.3738);
    expect(number.element().closest("fieldset")).toBe(
      page.getByRole("spinbutton", { name: "Degrees north (φ)" }).element().closest("fieldset"),
    );
    await page.getByRole("button", { name: "Zoom to next 2 hours", exact: true }).click();
    await waitForDraw();
    const selected = input('input[type="datetime-local"]').value;
    const before = plotPixels();
    await number.fill("-90");
    await waitForDraw();
    expect((slider.element() as HTMLInputElement).valueAsNumber).toBe(-90);
    expect(input('input[type="datetime-local"]').value).toBe(selected);
    expect(plotPixels()).not.toBe(before);
    const west = plotPixels();
    setRange("Longitude (λ)", 90);
    await waitForDraw();
    expect((number.element() as HTMLInputElement).valueAsNumber).toBe(90);
    expect(plotPixels()).not.toBe(west);
    const overlay = plotOverlay();
    const { width, height } = overlay.getBoundingClientRect();
    await page.elementLocator(overlay).click({ position: { x: width / 2, y: height / 2 } });
    await waitForDraw();
    const timestamp = new Date(input('input[type="datetime-local"]').value).getTime();
    expect(Math.abs(timestamp - new Date(selected).getTime() - 60 * 60_000)).toBeLessThan(15_000);
    expect(host.querySelector("math")!.textContent).toContain("λ");
    expect(host.querySelector("math")!.textContent).toContain("H");
    expect(
      page.getByRole("img", { name: "Solar hour angle H(λ, t) illustration" }).element(),
    ).toBeVisible();
  });
  it("syncs an editable year position with date/time, chart selection, and playback", async () => {
    const yearInput = page.getByRole("spinbutton", { name: "Year position (t)" });
    await yearInput.fill("0.25");
    await waitForDraw();
    expect((yearInput.element() as HTMLInputElement).valueAsNumber).toBeCloseTo(0.25, 6);
    expect((yearInput.element() as HTMLInputElement).value).toBe("0.25000000");
    expect(input('input[type="datetime-local"]').value).toContain("2026-04-02");
    expect(hasMarkerColor(0.25, 80, [31, 119, 180])).toBe(true);
    await page.getByLabelText("Local time (t, Europe/Vienna)").fill("2026-01-01T00:00");
    await waitForDraw();
    expect((yearInput.element() as HTMLInputElement).valueAsNumber).toBe(0);
    const overlay = plotOverlay();
    const { width, height } = overlay.getBoundingClientRect();
    await page.elementLocator(overlay).click({ position: { x: width / 2, y: height / 2 } });
    await waitForDraw();
    expect((yearInput.element() as HTMLInputElement).valueAsNumber).toBeCloseTo(0.5, 2);
    setRange("Playback speed (v)", 100);
    await page.getByRole("switch", { name: "Live play" }).click();
    const before = (yearInput.element() as HTMLInputElement).valueAsNumber;
    await expect
      .poll(() => (yearInput.element() as HTMLInputElement).valueAsNumber)
      .toBeGreaterThan(before);
    await page.getByRole("switch", { name: "Live play" }).click();
  });

  it("places the formula before the chart and labels controls with its variables", () => {
    const formula = host.querySelector("math")!;
    const chart = host.querySelector("canvas")!;
    expect(formula.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(page.getByRole("spinbutton", { name: "Degrees north (φ)" }).element()).toBeVisible();
    expect(page.getByRole("slider", { name: "Latitude (φ)" }).element()).toBeVisible();
    expect(page.getByLabelText("Local time (t, Europe/Vienna)").element()).toBeVisible();
    expect(page.getByRole("slider", { name: "Playback speed (v)" }).element()).toBeVisible();
  });

  it("zooms to the selected month, week, and next ten minutes", async () => {
    const clickMiddle = async () => {
      await waitForDraw();
      const overlay = plotOverlay();
      const { width, height } = overlay.getBoundingClientRect();
      await page.elementLocator(overlay).click({ position: { x: width / 2, y: height / 2 } });
      await waitForDraw();
      return new Date(input('input[type="datetime-local"]').value).getTime();
    };
    await page.getByRole("button", { name: "Zoom to month", exact: true }).click();
    expect(
      Math.abs((await clickMiddle()) - new Date("2026-06-16T00:00:00+02:00").getTime()),
    ).toBeLessThan(60 * 60_000);
    await page.getByRole("button", { name: "Zoom to week", exact: true }).click();
    const middle = await clickMiddle();
    expect(Math.abs(middle - new Date("2026-06-18T12:00:00+02:00").getTime())).toBeLessThan(
      20 * 60_000,
    );
    await page.getByRole("button", { name: "Zoom to next 10 minutes", exact: true }).click();
    expect(Math.abs((await clickMiddle()) - middle - 5 * 60_000)).toBeLessThan(5_000);
  });

  it("zooms to today, the next two hours, and back to the full year", async () => {
    await page.getByLabelText("Local time (t, Europe/Vienna)").fill("2024-12-21T23:00");
    await page.getByRole("button", { name: "Zoom to today", exact: true }).click();
    await waitForDraw();
    const overlay = plotOverlay();
    const clickMiddle = async () => {
      const { width, height } = overlay.getBoundingClientRect();
      await page.elementLocator(overlay).click({ position: { x: width / 2, y: height / 2 } });
      await waitForDraw();
    };
    await clickMiddle();
    const midday = new Date(input('input[type="datetime-local"]').value).getTime();
    expect(Math.abs(midday - new Date("2026-06-21T12:00:00+02:00").getTime())).toBeLessThan(
      2 * 60_000,
    );

    await page.getByRole("button", { name: "Zoom to next 2 hours", exact: true }).click();
    await waitForDraw();
    await clickMiddle();
    const later = new Date(input('input[type="datetime-local"]').value).getTime();
    expect(Math.abs(later - midday - 60 * 60_000)).toBeLessThan(15_000);

    const selected = input('input[type="datetime-local"]').value;
    await page.getByRole("button", { name: "Zoom to year", exact: true }).click();
    await waitForDraw();
    expect(input('input[type="datetime-local"]').value).toBe(selected);
    await clickMiddle();
    expect(selectedYearPosition()).toBeCloseTo(0.5, 2);
  });

  it("keeps a two-hour zoom across New Year when selecting its next-year portion", async () => {
    await page.getByLabelText("Local time (t, Europe/Vienna)").fill("2026-12-31T23:00");
    await page.getByRole("button", { name: "Zoom to next 2 hours", exact: true }).click();
    await waitForDraw();
    const overlay = plotOverlay();
    const { width, height } = overlay.getBoundingClientRect();
    await page.elementLocator(overlay).click({ position: { x: width * 0.75, y: height / 2 } });
    await waitForDraw();
    const selected = new Date(input('input[type="datetime-local"]').value).getTime();
    expect(Math.abs(selected - new Date("2027-01-01T00:30:00+01:00").getTime())).toBeLessThan(
      15_000,
    );
    await page.elementLocator(overlay).click({ position: { x: width / 2, y: height / 2 } });
    await waitForDraw();
    const middle = new Date(input('input[type="datetime-local"]').value).getTime();
    expect(Math.abs(middle - new Date("2027-01-01T00:00:00+01:00").getTime())).toBeLessThan(15_000);
  });

  it("syncs latitude inputs and updates the displayed angle and plot", async () => {
    const before = plotPixels();
    expect(input('input[type="number"]').valueAsNumber).toBe(48.2082);
    expect(input('input[aria-label="Latitude (φ)"]').valueAsNumber).toBe(48.2082);

    await page.getByRole("spinbutton", { name: "Degrees north (φ)" }).fill("0");
    await waitForDraw();
    expect(input('input[aria-label="Latitude (φ)"]').valueAsNumber).toBe(0);
    expect(plotPixels()).not.toBe(before);

    setRange("Latitude (φ)", -33.5);
    await waitForDraw();
    expect(input('input[type="number"]').valueAsNumber).toBe(-33.5);
    expect(plotPixels()).not.toBe(before);
  });

  it("syncs date/time selection with the year, readout, and marker", async () => {
    const before = plotPixels();
    const dateTime = page.getByLabelText("Local time (t, Europe/Vienna)");
    await dateTime.fill("2024-12-21T23:00");
    await waitForDraw();
    expect(input('input[type="datetime-local"]').value).toContain("2024-12-21T23:00");
    expect(plotPixels()).not.toBe(before);

    await page.getByRole("button", { name: "Now", exact: true }).click();
    await waitForDraw();
    expect(input('input[type="datetime-local"]').value).toContain("2026-06-21T12:00");
  });

  it("selects a timestamp by clicking the plot", async () => {
    const overlay = plotOverlay();
    const { width, height } = overlay.getBoundingClientRect();
    const before = plotPixels();
    await page.elementLocator(overlay).click({ position: { x: width / 4, y: height / 2 } });
    await waitForDraw();
    expect(selectedYearPosition()).toBeCloseTo(0.25, 2);
    expect(input('input[type="datetime-local"]').value).toContain("2026-04-02");
    expect(plotPixels()).not.toBe(before);
    expect(hasMarkerColor(0.25, 80, [31, 119, 180])).toBe(true);
    for (let angle = 70; angle < 80; angle += 0.5) {
      expect(hasMarkerColor(0.25, angle, [31, 119, 180], 0)).toBe(true);
    }
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
    const initial = selectedYearPosition();
    const initialTime = input('input[type="datetime-local"]').value;
    setRange("Playback speed (v)", 100);
    await page.getByRole("switch", { name: "Live play" }).click();
    await expect.poll(() => input('input[type="datetime-local"]').value).not.toBe(initialTime);
    await expect.poll(selectedYearPosition).not.toBe(initial);
    await page.getByRole("switch", { name: "Live play" }).click();
    const paused = selectedYearPosition();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(selectedYearPosition()).toBe(paused);
    await page.getByRole("button", { name: "Real time (1×)" }).click();
    expect(input('input[aria-label="Playback speed (v)"]').valueAsNumber).toBe(1);
    setRange("Playback speed (v)", 0.5);
    await nextTick();
    await expect.element(page.getByText("Speed (v): 0.5×")).toBeVisible();
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
    expect(hasMarkerColor(0.65, -65.25, [214, 39, 40])).toBe(false);
    expect(hasMarkerColor(0.65, 18.37, [255, 127, 14])).toBe(true);
    const math = host.querySelector("math");
    expect(math).not.toBeNull();
    expect(host.querySelector("details")).toBeNull();
    expect(host.querySelector("h2")).toBeNull();
    expect(page.getByRole("img", { name: "Latitude φ illustration" }).element()).toBeVisible();
    expect(page.getByRole("img", { name: "Year position t illustration" }).element()).toBeVisible();
    expect(page.getByRole("img", { name: "Longitude λ illustration" }).element()).toBeVisible();
    expect(page.getByRole("img", { name: "Sun angle α illustration" }).element()).toBeVisible();
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
