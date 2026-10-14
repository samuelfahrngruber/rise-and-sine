export function daysInYear(year: number): number {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
}

export function yearBounds(year: number): { start: number; end: number } {
  const start = new Date(0);
  start.setFullYear(year, 0, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setFullYear(year + 1);
  return { start: start.getTime(), end: end.getTime() };
}

export function yearPosition(timestamp: number, year = new Date(timestamp).getFullYear()): number {
  const { start, end } = yearBounds(year);
  return (timestamp - start) / (end - start);
}

export function dayZoomRange(timestamp: number): [number, number] {
  const start = new Date(timestamp);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const year = start.getFullYear();
  return [yearPosition(start.getTime(), year), yearPosition(end.getTime(), year)];
}

export function nextTwoHoursZoomRange(timestamp: number): [number, number] {
  return nextMinutesZoomRange(timestamp, 120);
}

export function nextTenMinutesZoomRange(timestamp: number): [number, number] {
  return nextMinutesZoomRange(timestamp, 10);
}

function nextMinutesZoomRange(timestamp: number, minutes: number): [number, number] {
  const year = new Date(timestamp).getFullYear();
  return [yearPosition(timestamp, year), yearPosition(timestamp + minutes * 60_000, year)];
}

export function monthZoomRange(timestamp: number): [number, number] {
  const start = new Date(timestamp);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  const year = start.getFullYear();
  return [yearPosition(start.getTime(), year), yearPosition(end.getTime(), year)];
}

export function weekZoomRange(timestamp: number): [number, number] {
  const start = new Date(timestamp);
  const year = start.getFullYear();
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return [yearPosition(start.getTime(), year), yearPosition(end.getTime(), year)];
}

export function timestampAtPosition(position: number, year: number, clamp = true): number {
  const { start, end } = yearBounds(year);
  const selected = clamp ? Math.max(0, Math.min(1, position)) : position;
  return Math.round(start + selected * (end - start));
}

export function toDateTimeInput(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function fromDateTimeInput(value: string): number | undefined {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp) || toDateTimeInput(timestamp) !== value) return;
  return timestamp;
}
