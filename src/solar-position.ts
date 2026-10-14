import type { PlotData } from "./plot-data";
import { yearBounds } from "./year-time";

export const VIENNA_LATITUDE = 48.2082;
export const VIENNA_LONGITUDE = 16.3738;
const DAY = 86_400_000;
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

// NOAA's approximate geometric solar position; no atmospheric refraction.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
function solarBasis(timestamp: number, longitude: number): SolarBasis {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const days = (Date.UTC(year + 1, 0, 1) - start) / DAY;
  const gamma = (2 * Math.PI * ((timestamp - start) / DAY - 0.5)) / days;
  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const utcMinutes =
    date.getUTCHours() * 60 +
    date.getUTCMinutes() +
    date.getUTCSeconds() / 60 +
    date.getUTCMilliseconds() / 60_000;
  const solarMinutes = (((utcMinutes + equationOfTime + 4 * longitude) % 1440) + 1440) % 1440;
  const hourAngle = (solarMinutes / 4 - 180) * RADIANS;
  return {
    declination: declination / RADIANS,
    hourAngle,
    sinDeclination: Math.sin(declination),
    cosDeclination: Math.cos(declination),
    cosDeclinationHourAngle: Math.cos(declination) * Math.cos(hourAngle),
  };
}

export function sunHourAngle(timestamp: number, longitude = VIENNA_LONGITUDE): number {
  return solarBasis(timestamp, longitude).hourAngle / RADIANS;
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
  const { start, end } = yearBounds(year);
  const minutes = (end - start) / 60_000;
  const x = Array.from(
    { length: minutes + 2 * extraMinutes + 1 },
    (_, index) => (index - extraMinutes) / minutes,
  );
  return {
    longitude,
    x,
    positions: x.map((position) => solarBasis(start + position * (end - start), longitude)),
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
