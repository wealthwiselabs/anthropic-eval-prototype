// Demo "now" is pinned to 2026-05-10T18:00:00Z so seeded relative timestamps
// stay stable across refreshes.
export const DEMO_NOW = new Date('2026-05-10T18:00:00Z');

export function relTime(iso: string, now: Date = DEMO_NOW): string {
  const diffMin = Math.max(1, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
