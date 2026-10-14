export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface PhotonFeature {
  geometry: { coordinates: number[] };
  properties: Record<string, unknown>;
}

async function lookup(
  path: string,
  parameters: Record<string, string>,
  signal: AbortSignal,
): Promise<Location[]> {
  const url = new URL(path, "https://photon.komoot.io");
  url.search = new URLSearchParams({ ...parameters, lang: "en" }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Location lookup failed");
  const data: { features: PhotonFeature[] } = await response.json();
  return data.features.flatMap(({ geometry, properties }) => {
    const [longitude, latitude] = geometry.coordinates;
    if (
      latitude === undefined ||
      longitude === undefined ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    )
      return [];
    const parts = [properties.name, properties.city, properties.state, properties.country].filter(
      (part): part is string => typeof part === "string" && part.length > 0,
    );
    const name = [...new Set(parts)].join(", ");
    return name ? [{ name, latitude, longitude }] : [];
  });
}

export function searchLocations(query: string, signal: AbortSignal): Promise<Location[]> {
  return lookup("/api/", { q: query, limit: "5" }, signal);
}

export async function reverseLocation(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
): Promise<Location | undefined> {
  const locations = await lookup(
    "/reverse",
    { lat: String(latitude), lon: String(longitude), limit: "1" },
    signal,
  );
  return locations[0];
}
