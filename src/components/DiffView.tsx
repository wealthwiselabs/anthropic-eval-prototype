import type { DiffStatus } from '../lib/diff';

export function DiffBadge({ status }: { status: DiffStatus }) {
  if (status === 'regression') {
    return (
      <span className="inline-flex items-center text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-coral text-white">
        Regression
      </span>
    );
  }
  if (status === 'fixed') {
    return (
      <span className="inline-flex items-center text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-node-start text-ink">
        Fixed
      </span>
    );
  }
  return null;
}
