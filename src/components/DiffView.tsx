import type { Run, RunResult } from '../types';

// Per-case diff status compared to the prior run for the same test set.
// 'regression': previous passed, current failed
// 'fixed': previous failed, current passed
// 'unchanged': same verdict or no prior
export type DiffStatus = 'regression' | 'fixed' | 'unchanged';

export function diffStatusFor(caseId: string, current: Run, previous: Run | null): DiffStatus {
  if (!previous) return 'unchanged';
  const cur = current.results.find((r) => r.caseId === caseId);
  const prev = previous.results.find((r) => r.caseId === caseId);
  if (!cur || !prev) return 'unchanged';
  if (prev.passed && !cur.passed) return 'regression';
  if (!prev.passed && cur.passed) return 'fixed';
  return 'unchanged';
}

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

// Convenience selector: find the most recent run before `current` for the
// same test set. Returns null when no prior run exists.
export function priorRunFor(current: Run, allRuns: Run[]): Run | null {
  const candidates = allRuns
    .filter((r) => r.testSetId === current.testSetId && r.ranAt < current.ranAt)
    .sort((a, b) => (a.ranAt < b.ranAt ? 1 : -1));
  return candidates[0] ?? null;
}

// Summary numbers used by the optional summary header in TestSetRun.
export function diffCounts(current: Run, previous: Run | null): { regressed: number; fixed: number } {
  if (!previous) return { regressed: 0, fixed: 0 };
  let regressed = 0;
  let fixed = 0;
  for (const cr of current.results) {
    const pr: RunResult | undefined = previous.results.find((r) => r.caseId === cr.caseId);
    if (!pr) continue;
    if (pr.passed && !cr.passed) regressed += 1;
    if (!pr.passed && cr.passed) fixed += 1;
  }
  return { regressed, fixed };
}
