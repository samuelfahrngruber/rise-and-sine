export function yearBounds(year: number): { start: number; end: number } {
  const start = new Date(0);
  start.setFullYear(year, 0, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setFullYear(year + 1);
  return { start: start.getTime(), end: end.getTime() };
}

export function yearPosition(timestamp: number): number {
  const { start, end } = yearBounds(new Date(timestamp).getFullYear());
  return (timestamp - start) / (end - start);
}

export function timestampAtPosition(position: number, year: number): number {
  const { start, end } = yearBounds(year);
  return Math.round(start + Math.max(0, Math.min(1, position)) * (end - start));
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
