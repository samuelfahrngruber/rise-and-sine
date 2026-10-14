import type { PlotData } from "./plot-data";
import { yearBounds, yearPosition } from "./year-time";

export const VIENNA_LATITUDE = 48.2082;
export const VIENNA_LONGITUDE = 16.3738;
export const EARTH_TILT = 23.44;
const RADIANS = Math.PI / 180;

interface SolarBasis {
  declination: number;
  hourAngle: number;
  sinDeclination: number;
  cosDeclination: number;
  cosDeclinationHourAngle: number;
}

export interface SolarYear {
  longitude: number;
  x: number[];
  positions: SolarBasis[];
}

interface SolarSeason {
  start: number;
  end: number;
  equinox: number;
}

function solarSeason(year: number): SolarSeason {
  return { ...yearBounds(year), equinox: Date.UTC(year, 2, 21, 12) };
}

export function equinoxPosition(year: number): number {
  return yearPosition(Date.UTC(year, 2, 21, 12), year);
}

export function solarTime(timestamp: number): { minutes: number } {
  const date = new Date(timestamp);
  return {
    minutes:
      date.getUTCHours() * 60 +
      date.getUTCMinutes() +
      date.getUTCSeconds() / 60 +
      date.getUTCMilliseconds() / 60_000,
  };
}

// Rotation at local January 1, at zero longitude, in radians.
export function initialRotation(year: number): number {
  return (solarTime(yearBounds(year).start).minutes * Math.PI) / 720 - Math.PI;
}

function seasonalDeclination(timestamp: number, season: SolarSeason): number {
  return (
    EARTH_TILT *
    Math.sin((2 * Math.PI * (timestamp - season.equinox)) / (season.end - season.start))
  );
}

export function sunDeclination(timestamp: number): number {
  return seasonalDeclination(timestamp, solarSeason(new Date(timestamp).getFullYear()));
}

export function sunHourAngle(timestamp: number, longitude = VIENNA_LONGITUDE): number {
  const minutes = solarTime(timestamp).minutes;
  const solarMinutes = (((minutes + 4 * longitude) % 1440) + 1440) % 1440;
  return solarMinutes / 4 - 180;
}

// Circular-orbit approximation: fixed axial tilt and uniform daily rotation.
function solarBasis(
  timestamp: number,
  longitude: number,
  season = solarSeason(new Date(timestamp).getFullYear()),
): SolarBasis {
  const declination = seasonalDeclination(timestamp, season) * RADIANS;
  const hourAngle = sunHourAngle(timestamp, longitude) * RADIANS;
  return {
    declination: declination / RADIANS,
    hourAngle,
    sinDeclination: Math.sin(declination),
    cosDeclination: Math.cos(declination),
    cosDeclinationHourAngle: Math.cos(declination) * Math.cos(hourAngle),
  };
}

function elevation(
  basis: SolarBasis,
  sinLatitude: number,
  cosLatitude: number,
  longitudeOffset = 0,
): number {
  const cosine =
    longitudeOffset === 0
      ? basis.cosDeclinationHourAngle
      : basis.cosDeclination * Math.cos(basis.hourAngle + longitudeOffset);
  const sine = sinLatitude * basis.sinDeclination + cosLatitude * cosine;
  return Math.asin(Math.max(-1, Math.min(1, sine))) / RADIANS;
}

export function sunElevation(
  timestamp: number,
  latitude: number,
  longitude = VIENNA_LONGITUDE,
): number {
  return elevation(
    solarBasis(timestamp, longitude),
    Math.sin(latitude * RADIANS),
    Math.cos(latitude * RADIANS),
  );
}

export function sampleSolarYear(
  year: number,
  longitude = VIENNA_LONGITUDE,
  extraMinutes = 0,
): SolarYear {
  const season = solarSeason(year);
  const { start, end } = season;
  const minutes = (end - start) / 60_000;
  const x = Array.from(
    { length: minutes + 2 * extraMinutes + 1 },
    (_, index) => (index - extraMinutes) / minutes,
  );
  return {
    longitude,
    x,
    positions: x.map((position) => {
      const timestamp = start + position * (end - start);
      return solarBasis(
        timestamp,
        longitude,
        timestamp >= start && timestamp < end ? season : undefined,
      );
    }),
  };
}

export function solarYearPlot(
  samples: SolarYear,
  latitude: number,
  longitude = samples.longitude,
): PlotData {
  const sinLatitude = Math.sin(latitude * RADIANS);
  const cosLatitude = Math.cos(latitude * RADIANS);
  const longitudeOffset = (longitude - samples.longitude) * RADIANS;
  return {
    x: samples.x,
    series: [
      {
        label: "Elevation",
        values: samples.positions.map((basis) =>
          elevation(basis, sinLatitude, cosLatitude, longitudeOffset),
        ),
      },
      {
        label: "Daily maximum",
        color: "#2ca02c",
        values: samples.positions.map((basis) => 90 - Math.abs(latitude - basis.declination)),
      },
      {
        label: "Daily minimum",
        color: "#d62728",
        values: samples.positions.map((basis) => Math.abs(latitude + basis.declination) - 90),
      },
    ],
  };
}
