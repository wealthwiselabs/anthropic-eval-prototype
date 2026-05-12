import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Judge, Session } from '../types';
import { sessions } from '../data/sessions';
import { useStore } from '../store/useStore';
import { Modal } from './Modal';
import { OverallVerdictPill } from './OverallVerdictPill';

type Props = {
  open: boolean;
  onClose: () => void;
  judge: Judge;
};

type JudgeModel = 'claude-opus-4-7' | 'claude-sonnet-4-6' | 'claude-haiku-4-5';
type OutputType = 'binary' | 'score' | 'categorical';
type JudgeScope = 'turn' | 'session';

const DEFAULT_INSTRUCTIONS = `You are evaluating whether a multi-turn travel assistant successfully completed a user's trip-planning task.

The user request and full conversation are in {{input}}.
The agent's final response is in {{output}}.
The user's stated constraints (budget, dates, destinations) are in {{expected}}.

A session PASSES only if all of the following are true:
- The agent produced a bookable end state (flights, hotels, itinerary)
- All user-stated constraints were respected (or the agent surfaced a clear tradeoff)
- The itinerary is internally consistent across days (no contradictions)

Return ONLY one of: PASS or FAIL.
If FAIL, include a one-sentence reason after a pipe character: FAIL | <reason>`;

// Three curated sample-trace options for the test panel. We hand-pick from the
// seeded sessions to surface believable session IDs and labels.
type SampleOption = {
  sessionId: string;
  label: string;
};

function pickSampleSessions(): SampleOption[] {
  // Prefer a failing session first (so reviewers see a FAIL result), then a
  // passing one, then a short single-turn one. Fall back gracefully if seeds
  // shift.
  const failing = sessions.find((s) => s.dominantStatus === 'fail' && s.turns >= 4);
  const passing = sessions.find(
    (s) => s.dominantStatus === 'pass' && s.turns >= 4 && s.id !== failing?.id,
  );
  const short = sessions.find(
    (s) => s.turns <= 2 && s.id !== failing?.id && s.id !== passing?.id,
  );

  const picks: { sess: Session | undefined; suffix: string; descriptor: string }[] = [
    { sess: failing, suffix: 'A', descriptor: 'context drop on Tokyo→Paris' },
    { sess: passing, suffix: 'B', descriptor: 'happy path 5-day trip' },
    { sess: short, suffix: 'C', descriptor: 'short single-turn query' },
  ];

  return picks
    .filter((p): p is { sess: Session; suffix: string; descriptor: string } => Boolean(p.sess))
    .map((p) => ({
      sessionId: p.sess.id,
      // Shorten session id like "sess_01HX...A" for readability while keeping
      // it unambiguous via the trailing suffix tag.
      label: `${p.sess.id.slice(0, 9)}...${p.suffix} — ${p.descriptor}`,
    }));
}

type TestResult = {
  passed: boolean;
  reasoning: string;
  latencyMs: number;
  costUsd: number;
};

function computeTestResult(sessionId: string): TestResult {
  const sess = sessions.find((s) => s.id === sessionId);
  if (!sess) {
    return {
      passed: false,
      reasoning: 'Sample trace not found in seed data.',
      latencyMs: 1200,
      costUsd: 0.003,
    };
  }
  const passed = sess.dominantStatus === 'pass';
  // Prefer real session-level reasoning when available; fall back to a
  // plausible canned reason so the panel always reads as grounded.
  const sessionFail = sess.sessionScores.find((s) => s.verdict === 'fail');
  const fallback = passed
    ? 'All user constraints satisfied; itinerary consistent across days; bookable end state reached.'
    : "Itinerary contradicted earlier hotel choice; user constraint 'family-friendly' violated by day-3 venue selection.";
  const reasoning = sessionFail?.reasoning ?? fallback;
  return {
    passed,
    reasoning,
    latencyMs: 1200,
    costUsd: 0.003,
  };
}

// Edit modal for a project-specific LLM judge. Two-column body: config form
// on the left, dry-run test panel on the right. No real persistence — saving
// fires a toast and closes; the test panel is visual-only and deterministic
// against the seeded session data.
export function EditJudgeModal({ open, onClose, judge }: Props) {
  const showToast = useStore((s) => s.showToast);

  const sampleOptions = useMemo(() => pickSampleSessions(), []);

  const [name, setName] = useState(judge.name);
  const [model, setModel] = useState<JudgeModel>('claude-opus-4-7');
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS);
  const [outputType, setOutputType] = useState<OutputType>('binary');
  const [passThreshold, setPassThreshold] = useState(3);
  const [scope, setScope] = useState<JudgeScope>(judge.scope);

  const [selectedSampleId, setSelectedSampleId] = useState<string>(
    sampleOptions[0]?.sessionId ?? '',
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  // Reset / hydrate when (re)opened for a different judge
  useEffect(() => {
    if (!open) return;
    setName(judge.name);
    setModel('claude-opus-4-7');
    setInstructions(DEFAULT_INSTRUCTIONS);
    setOutputType('binary');
    setPassThreshold(3);
    setScope(judge.scope);
    setSelectedSampleId(sampleOptions[0]?.sessionId ?? '');
    setRunning(false);
    setResult(null);
  }, [open, judge, sampleOptions]);

  function handleRunTest() {
    if (!selectedSampleId || running) return;
    setRunning(true);
    setResult(null);
    // Deterministic 800ms spinner before result renders.
    window.setTimeout(() => {
      setResult(computeTestResult(selectedSampleId));
      setRunning(false);
    }, 800);
  }

  function handleSave() {
    showToast('Judge updated');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} width={820} ariaLabel="Edit judge">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-border">
        <div className="min-w-0">
          <h2 className="font-serif text-lg text-ink truncate">Edit judge: {judge.name}</h2>
          <p className="text-xs text-muted mt-1">
            Changes apply to this project only. To edit the org-wide default, clone it in the
            Judge library.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted hover:text-ink transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* Left column — Configuration form */}
          <div className="flex flex-col gap-4">
            {/* Name */}
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-border rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-coral"
              />
              <span className="text-xs text-muted">Shown on trace cards and judge library.</span>
            </label>

            {/* Judge model */}
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted">Judge model</span>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as JudgeModel)}
                className="border border-border rounded px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:border-coral"
              >
                <option value="claude-opus-4-7">claude-opus-4-7</option>
                <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
                <option value="claude-haiku-4-5">claude-haiku-4-5</option>
              </select>
              <span className="text-xs text-muted">
                Pick the model that runs this judge against your traces. Faster models are cheaper
                but may be less reliable on nuanced rubrics.
              </span>
            </label>

            {/* Instructions */}
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted">Instructions</span>
              <div className="flex items-center gap-1.5">
                {(['{{input}}', '{{output}}', '{{expected}}'] as const).map((chip) => (
                  <span
                    key={chip}
                    title="Available in the judge prompt. Replaced at runtime with the trace data."
                    className="inline-flex items-center font-mono text-[11px] text-ink/80 bg-canvas border border-border rounded px-1.5 py-0.5"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={12}
                className="border border-border rounded px-3 py-2 font-mono text-xs text-ink focus:outline-none focus:border-coral resize-y"
              />
            </div>

            {/* Output type */}
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted">Output type</span>
              <div className="inline-flex border border-border rounded overflow-hidden w-fit">
                <button
                  type="button"
                  onClick={() => setOutputType('binary')}
                  className={
                    'px-3 py-1.5 text-sm transition-colors ' +
                    (outputType === 'binary'
                      ? 'bg-ink text-white'
                      : 'bg-white text-ink/70 hover:bg-canvas')
                  }
                >
                  Binary
                </button>
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="px-3 py-1.5 text-sm bg-white text-ink/40 cursor-not-allowed border-l border-border"
                >
                  Score (1–5)
                </button>
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="px-3 py-1.5 text-sm bg-white text-ink/40 cursor-not-allowed border-l border-border"
                >
                  Categorical
                </button>
              </div>
            </div>

            {/* Pass threshold (only when Score) */}
            {outputType === 'score' && (
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-muted">Pass threshold</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={passThreshold}
                  onChange={(e) => setPassThreshold(Number(e.target.value))}
                  className="border border-border rounded px-3 py-2 text-sm text-ink w-24 focus:outline-none focus:border-coral"
                />
              </label>
            )}

            {/* Scope */}
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted">Scope</span>
              <div className="inline-flex border border-border rounded overflow-hidden w-fit">
                <button
                  type="button"
                  onClick={() => setScope('turn')}
                  className={
                    'px-3 py-1.5 text-sm transition-colors ' +
                    (scope === 'turn'
                      ? 'bg-ink text-white'
                      : 'bg-white text-ink/70 hover:bg-canvas')
                  }
                >
                  Per-trace
                </button>
                <button
                  type="button"
                  onClick={() => setScope('session')}
                  className={
                    'px-3 py-1.5 text-sm transition-colors border-l border-border ' +
                    (scope === 'session'
                      ? 'bg-ink text-white'
                      : 'bg-white text-ink/70 hover:bg-canvas')
                  }
                >
                  Per-session
                </button>
              </div>
              <span className="text-xs text-muted">
                Per-trace judges score each API call. Per-session judges score the whole
                conversation outcome.
              </span>
            </div>
          </div>

          {/* Right column — Test panel */}
          <div className="flex flex-col gap-3">
            <div className="border border-border rounded-lg p-4 bg-chrome flex flex-col gap-3">
              <div>
                <h3 className="font-serif text-base text-ink">Test judge</h3>
                <p className="text-xs text-muted mt-0.5">
                  Pick a sample trace to dry-run this judge.
                </p>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-muted">Sample trace</span>
                <select
                  value={selectedSampleId}
                  onChange={(e) => {
                    setSelectedSampleId(e.target.value);
                    setResult(null);
                  }}
                  className="border border-border rounded px-2 py-1.5 text-xs text-ink bg-white focus:outline-none focus:border-coral"
                >
                  {sampleOptions.map((opt) => (
                    <option key={opt.sessionId} value={opt.sessionId}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={handleRunTest}
                disabled={!selectedSampleId || running}
                className="w-full px-3 py-2 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {running ? 'Running…' : 'Run test'}
              </button>

              {running && (
                <div className="flex items-center justify-center py-3">
                  <span
                    className="inline-block w-5 h-5 rounded-full border-2 border-border border-t-coral animate-spin"
                    aria-label="Loading"
                  />
                </div>
              )}

              {!running && result && (
                <div className="flex flex-col gap-2 pt-1">
                  <div>
                    <OverallVerdictPill passed={result.passed} size="md" />
                  </div>
                  <blockquote className="border-l-2 border-border bg-white rounded px-3 py-2 text-xs text-ink/80 leading-relaxed">
                    {result.reasoning}
                  </blockquote>
                  <div className="text-[11px] text-muted font-mono">
                    Latency: {(result.latencyMs / 1000).toFixed(1)}s · Cost: $
                    {result.costUsd.toFixed(3)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-chrome">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-ink/80 hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="px-3 py-1.5 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save changes
        </button>
      </div>
    </Modal>
  );
}
