/**
 * Formats a decimal hours value into a human-readable "Xh Ym" string.
 * Examples: 1.5 → "1h 30m", 0.25 → "15m", 2 → "2h"
 */
export function formatHours(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}
