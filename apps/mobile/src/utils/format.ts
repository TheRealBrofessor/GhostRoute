import { formatClock } from "@ghostroute/comparison";

export { formatClock, formatLiveDelta } from "@ghostroute/comparison";

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return `${Math.round(seconds)} sec`;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}

export function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  if (miles < 0.1) return `${Math.round(meters)} ft`;
  return `${miles.toFixed(1)} mi`;
}

export function formatSpeed(metersPerSecond: number): string {
  const mph = metersPerSecond * 2.23694;
  return `${mph.toFixed(1)} mph avg`;
}

/** Signed total delta for the post-drive screen, e.g. "+1:24" / "-0:36". */
export function formatSignedClock(deltaSeconds: number): string {
  const sign = deltaSeconds > 0 ? "+" : deltaSeconds < 0 ? "-" : "±";
  return `${sign}${formatClock(deltaSeconds)}`;
}
