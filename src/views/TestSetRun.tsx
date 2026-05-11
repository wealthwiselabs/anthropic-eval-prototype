import { Fragment, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ProjectShell } from '../components/ProjectShell';
import { useStore } from '../store/useStore';
import { relTime } from '../lib/time';
import { DiffBadge } from '../components/DiffView';
import { diffCounts, diffStatusFor, priorRunFor } from '../lib/diff';

export function TestSetRun() {
  const { id, runId } = useParams<{ id: string; runId: string }>();
  const testSets = useStore((s) => s.testSets);
  const runs = useStore((s) => s.runs);
  const testSet = testSets.find((t) => t.id === id);
  const run = runs.find((r) => r.id === runId);

  const [compareMode, setCompareMode] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const prior = useMemo(() => (run ? priorRunFor(run, runs) : null), [run, runs]);
  const counts = useMemo(() => (run ? diffCounts(run, prior) : { regressed: 0, fixed: 0 }), [run, prior]);

  if (!testSet || !run) {
    return (
      <ProjectShell activeTab="test-sets">
        <div className="text-sm text-muted">
          Run not found.{' '}
          <Link to="/eval/travel-agent/test-sets" className="text-coral hover:underline">
            Back to test sets
          </Link>
        </div>
      </ProjectShell>
    );
  }

  const total = run.passed + run.failed;
  const allPass = run.failed === 0;

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <ProjectShell activeTab="test-sets">
      {/* Header */}
      <section>
        <Link
          to={`/eval/travel-agent/test-sets/${testSet.id}`}
          className="text-xs text-muted hover:text-ink"
        >
          ‹ Back to test set
        </Link>
        <div className="flex items-start justify-between gap-4 mt-1">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="font-serif text-2xl text-ink">{testSet.name}</h1>
            <div className="text-xs text-muted flex items-center gap-3 flex-wrap">
              <span>Ran {relTime(run.ranAt)}</span>
              <span>·</span>
              <span className="font-mono text-ink/80">{run.model}</span>
              <span>·</span>
              <span className="font-mono">run_{run.id.replace(/^run_/, '')}</span>
            </div>
          </div>
          <span
            className={
              'flex-shrink-0 inline-flex items-center font-mono text-base px-3 py-1 rounded ' +
              (allPass ? 'bg-node-start text-ink' : 'bg-coral/15 text-coral')
            }
          >
            {run.passed}/{total} passed
          </span>
        </div>
      </section>

      {/* Summary band: 3 KPI tiles */}
      <section className="grid grid-cols-3 gap-4">
        <SummaryTile label="Passed" value={String(run.passed)} tone="green" />
        <SummaryTile label="Failed" value={String(run.failed)} tone="red" />
        <SummaryTile label="Total cases" value={String(total)} />
      </section>

      {/* Cases table */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg text-ink">Cases</h2>
          {prior && (
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
              <span className="text-muted">Compare to previous run</span>
              <span
                onClick={() => setCompareMode((v) => !v)}
                className={
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors ' +
                  (compareMode ? 'bg-coral' : 'bg-border')
                }
              >
                <span
                  className={
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' +
                    (compareMode ? 'translate-x-4' : 'translate-x-0.5')
                  }
                />
              </span>
            </label>
          )}
        </div>

        {prior && compareMode && (counts.regressed > 0 || counts.fixed > 0) && (
          <div className="mb-3 text-xs text-muted flex items-center gap-3">
            <span>Compared to run from {relTime(prior.ranAt)}:</span>
            {counts.regressed > 0 && (
              <span className="font-mono text-coral">+{counts.regressed} regressed</span>
            )}
            {counts.fixed > 0 && (
              <span className="font-mono text-success">+{counts.fixed} fixed</span>
            )}
          </div>
        )}

        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-chrome border-b border-border">
              <tr>
                <Th>{''}</Th>
                <Th>Input</Th>
                <Th>Expected</Th>
                <Th>Actual</Th>
                <Th>Verdict</Th>
                {prior && compareMode && <Th>Diff</Th>}
              </tr>
            </thead>
            <tbody>
              {testSet.cases.map((c) => {
                const result = run.results.find((r) => r.caseId === c.id);
                if (!result) return null;
                const isExpanded = !!expanded[c.id];
                const diff = diffStatusFor(c.id, run, compareMode ? prior : null);
                const failed = !result.passed;
                return (
                  <Fragment key={c.id}>
                    <tr
                      onClick={() => failed && toggle(c.id)}
                      className={
                        'border-b border-border last:border-b-0 ' +
                        (failed ? 'cursor-pointer hover:bg-canvas' : '')
                      }
                    >
                      <td className="px-3 py-2 w-6 align-top">
                        {failed && (
                          <span className="text-muted">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-ink/90 truncate max-w-[220px]">
                        {c.inputSnippet}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted truncate max-w-[260px]">
                        {c.expectedBehavior}
                      </td>
                      <td className="px-3 py-2 text-xs text-ink/80 truncate max-w-[260px]">
                        {result.output}
                      </td>
                      <td className="px-3 py-2">
                        <VerdictPill passed={result.passed} />
                      </td>
                      {prior && compareMode && (
                        <td className="px-3 py-2">
                          <DiffBadge status={diff} />
                        </td>
                      )}
                    </tr>
                    {failed && isExpanded && (
                      <tr className="bg-canvas border-b border-border">
                        <td></td>
                        <td colSpan={prior && compareMode ? 5 : 4} className="px-3 py-3">
                          <div className="flex flex-col gap-2">
                            <div>
                              <div className="text-[11px] uppercase tracking-wide text-muted mb-1">
                                Full input
                              </div>
                              <div className="text-sm text-ink whitespace-pre-wrap">
                                {c.inputSnippet}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] uppercase tracking-wide text-muted mb-1">
                                Full output
                              </div>
                              <div className="text-sm text-ink whitespace-pre-wrap">
                                {result.output}
                              </div>
                            </div>
                            {result.judgeReasoning && (
                              <blockquote className="border-l-2 border-coral bg-coral/5 px-3 py-2 text-xs text-ink/80 italic leading-relaxed">
                                <span className="not-italic font-medium text-coral mr-1">
                                  judge:
                                </span>
                                {result.judgeReasoning}
                              </blockquote>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </ProjectShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-[11px] uppercase tracking-wide text-muted font-medium px-3 py-2">
      {children}
    </th>
  );
}

function VerdictPill({ passed }: { passed: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded ' +
        (passed ? 'bg-node-start text-ink' : 'bg-coral text-white')
      }
    >
      {passed ? 'Pass' : 'Fail'}
    </span>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'green' | 'red';
}) {
  // Reusing the KPITile look without the sparkline. Tone colors the number.
  const numCls =
    tone === 'green'
      ? 'text-success'
      : tone === 'red'
        ? 'text-coral'
        : 'text-ink';
  return (
    <div className="bg-white border border-border rounded-lg p-4 flex flex-col">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className={'mt-1 font-serif text-3xl leading-tight ' + numCls}>{value}</div>
    </div>
  );
}
