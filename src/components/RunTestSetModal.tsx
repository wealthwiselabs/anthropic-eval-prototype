import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { Run, RunResult, TestSet } from '../types';
import { useStore } from '../store/useStore';
import { Modal } from './Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  testSet: TestSet;
};

const MODELS = ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'] as const;
type ModelChoice = (typeof MODELS)[number];

const RUN_DURATION_MS = 1500;

// Same mulberry32 used in data/sessions.ts — keeping the impl local rather than
// importing so this module doesn't pull in the seeded sessions graph.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

// Pick which test-case indices fail for this run. Deterministic on the seed
// (testSet.id + model), so reloads produce identical results.
function pickFailingIndices(total: number, failCount: number, seed: number): Set<number> {
  const rng = mulberry32(seed);
  const indices = Array.from({ length: total }, (_, i) => i);
  // Fisher-Yates partial shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, failCount));
}

// Determine target fail count for this test set + model. Spec §3 demo flow
// step 6 wants 21/24 on the tool-arg cluster set. Booking-smoke should
// improve to 11/12 (regression-fix demo). Safety stays 18/18.
function planRunOutcome(testSet: TestSet, model: ModelChoice, priorRuns: Run[]): number {
  const total = testSet.cases.length;
  const seed = seedFromString(testSet.id + ':' + model);
  const rng = mulberry32(seed);

  // Cluster-derived from the tool-arg cluster → 21 pass / 3 fail per spec.
  if (testSet.source === 'from-cluster' && testSet.sourceClusterId === 'cluster_tool_arg_mismatch') {
    const passTarget = Math.round((21 / 24) * total);
    return Math.max(0, total - passTarget);
  }

  // Other cluster-derived sets: random pass rate 85-95%.
  if (testSet.source === 'from-cluster') {
    const passRate = 0.85 + rng() * 0.1;
    return Math.max(0, total - Math.round(total * passRate));
  }

  // Seeded "booking smoke": if a prior run exists, produce one strictly better
  // than the latest (regression-fix demo). Otherwise show 11/12 to match
  // the seeded last-run summary.
  if (testSet.id === 'ts_booking_smoke') {
    const sameSet = priorRuns
      .filter((r) => r.testSetId === testSet.id)
      .sort((a, b) => (a.ranAt < b.ranAt ? 1 : -1));
    const mostRecent = sameSet[0];
    if (!mostRecent) return 1;
    return Math.max(0, mostRecent.failed - 1);
  }

  // Seeded "safety regression": all pass.
  if (testSet.id === 'ts_safety_regression') return 0;

  // Generic seeded set fallback.
  return Math.max(0, Math.round(total * 0.1));
}

export function RunTestSetModal({ open, onClose, testSet }: Props) {
  const navigate = useNavigate();
  const addRun = useStore((s) => s.addRun);
  const runsState = useStore((s) => s.runs);
  const showToast = useStore((s) => s.showToast);

  // Form state initializes fresh on each mount; the parent forces remount
  // (via `key`) whenever the modal re-opens, so we don't need a reset effect.
  const [model, setModel] = useState<ModelChoice>('claude-opus-4-7');
  const [canary, setCanary] = useState(false);
  const [running, setRunning] = useState(false);

  function startRun() {
    if (running) return;
    setRunning(true);
    const startedAt = Date.now();

    // Compute results synchronously, then delay navigation so the spinner
    // shows for ~RUN_DURATION_MS — gives the demo perceived weight.
    const failCount = planRunOutcome(testSet, model, runsState);
    const failingIdx = pickFailingIndices(testSet.cases.length, failCount, seedFromString(testSet.id + ':' + model));

    const results: RunResult[] = testSet.cases.map((c, i) => {
      const passed = !failingIdx.has(i);
      return {
        caseId: c.id,
        passed,
        output: passed
          ? `Matched: ${c.expectedBehavior}`
          : `Did not match expected behavior. Got a tangential response.`,
        judgeReasoning: passed ? undefined : `agent output did not satisfy: "${c.expectedBehavior}"`,
      };
    });

    const passCount = results.filter((r) => r.passed).length;
    const run: Run = {
      id: `run_${Date.now()}`,
      testSetId: testSet.id,
      model,
      ranAt: new Date(startedAt + RUN_DURATION_MS).toISOString(),
      results,
      passed: passCount,
      failed: results.length - passCount,
    };

    window.setTimeout(() => {
      addRun(run);
      showToast(`Run complete · ${run.passed}/${results.length} passed`, {
        label: 'View results',
        to: `/eval/travel-agent/test-sets/${testSet.id}/runs/${run.id}`,
      });
      navigate(`/eval/travel-agent/test-sets/${testSet.id}/runs/${run.id}`);
      onClose();
    }, RUN_DURATION_MS);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={480}
      closeOnBackdropClick={!running}
      closeOnEscape={!running}
      ariaLabel="Run test set"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-serif text-lg text-ink">Run test set</h2>
          <button
            onClick={onClose}
            disabled={running}
            aria-label="Close"
            className="text-muted hover:text-ink transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {running ? (
          <RunningBody n={testSet.cases.length} model={model} />
        ) : (
          <>
            <div className="px-5 py-4 flex flex-col gap-4">
              <div className="text-sm text-ink/80">
                Running <span className="font-mono">{testSet.cases.length}</span> cases from{' '}
                <span className="text-ink">{testSet.name}</span>.
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-muted">Model</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as ModelChoice)}
                  className="border border-border rounded px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:border-coral"
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-muted">Prompt template</span>
                <select
                  disabled
                  className="border border-border rounded px-3 py-2 text-sm text-ink/60 bg-canvas cursor-not-allowed"
                  title="Mocked in this prototype"
                >
                  <option>Current production prompt (v2.1)</option>
                </select>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canary}
                  onChange={(e) => setCanary(e.target.checked)}
                  className="accent-coral"
                />
                <span className="text-sm text-ink/80">Tag this run as canary</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-chrome">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-ink/80 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startRun}
                className="px-3 py-1.5 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors"
              >
                Run {testSet.cases.length} cases
              </button>
            </div>
          </>
        )}
    </Modal>
  );
}

function RunningBody({ n, model }: { n: number; model: string }) {
  return (
    <div className="px-5 py-8 flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-coral border-t-transparent rounded-full animate-spin" />
      <div className="text-sm text-ink text-center">
        Running <span className="font-mono">{n}</span> cases against{' '}
        <span className="font-mono">{model}</span>…
      </div>
      <div className="w-full h-1.5 bg-canvas rounded overflow-hidden">
        <div className="h-full w-1/3 bg-coral/70 animate-pulse" />
      </div>
    </div>
  );
}
