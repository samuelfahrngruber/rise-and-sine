import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { searchLocations, reverseLocation } from "./location-api";

afterEach(() => vi.unstubAllGlobals());

describe("location API contract", () => {
  it("encodes search text and maps longitude-first coordinates", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            features: [
              {
                geometry: { coordinates: [16.3725, 48.2084] },
                properties: { name: "Vienna", city: "Vienna", country: "Austria" },
              },
            ],
          }),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;
    expect(await searchLocations("Vienna & surroundings", signal)).toEqual([
      { name: "Vienna, Austria", latitude: 48.2084, longitude: 16.3725 },
    ]);
    const [url, options] = fetchMock.mock.calls[0]! as unknown as [URL, RequestInit];
    expect(url.searchParams.get("q")).toBe("Vienna & surroundings");
    expect(options.signal).toBe(signal);
  });

  it("uses exact coordinates for reverse lookup and permits no nearby place", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ features: [] })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await reverseLocation(-10.25, 125.5, new AbortController().signal)).toBeUndefined();
    const [url] = fetchMock.mock.calls[0]! as unknown as [URL];
    expect(url.pathname).toBe("/reverse");
    expect(url.searchParams.get("lat")).toBe("-10.25");
    expect(url.searchParams.get("lon")).toBe("125.5");
  });

  it("rejects failed requests and discards invalid coordinates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503 })),
    );
    await expect(searchLocations("Vienna", new AbortController().signal)).rejects.toThrow();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              features: [
                {
                  geometry: { coordinates: [16, 95] },
                  properties: { name: "Invalid" },
                },
              ],
            }),
          ),
      ),
    );
    expect(await searchLocations("Invalid", new AbortController().signal)).toEqual([]);
  });
});
