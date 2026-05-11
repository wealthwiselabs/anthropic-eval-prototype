import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MoreHorizontal, Play, ChevronDown, ChevronRight } from 'lucide-react';
import { ProjectShell } from '../components/ProjectShell';
import { RunTestSetModal } from '../components/RunTestSetModal';
import { useStore } from '../store/useStore';
import { clusters } from '../data/clusters';
import { relTime } from '../lib/time';
import { diffCounts, priorRunFor } from '../lib/diff';
import type { TestSet } from '../types';

function sourceLabelFor(ts: TestSet): string {
  if (ts.source === 'seeded') return 'Seeded';
  const cluster = clusters.find((c) => c.id === ts.sourceClusterId);
  return cluster ? `From cluster: ${cluster.title}` : 'From cluster';
}

const DEFAULT_VISIBLE_CASES = 10;

export function TestSetDetail() {
  const { id } = useParams<{ id: string }>();
  const testSets = useStore((s) => s.testSets);
  const runs = useStore((s) => s.runs);
  const testSet = testSets.find((t) => t.id === id);

  const [runOpen, setRunOpen] = useState(false);
  const [casesExpanded, setCasesExpanded] = useState(true);
  const [showAllCases, setShowAllCases] = useState(false);

  const myRuns = useMemo(() => {
    if (!testSet) return [];
    return runs
      .filter((r) => r.testSetId === testSet.id)
      .sort((a, b) => (a.ranAt < b.ranAt ? 1 : -1));
  }, [runs, testSet]);

  if (!testSet) {
    return (
      <ProjectShell activeTab="test-sets">
        <div className="text-sm text-muted">
          Test set not found.{' '}
          <Link to="/eval/travel-agent/test-sets" className="text-coral hover:underline">
            Back to test sets
          </Link>
        </div>
      </ProjectShell>
    );
  }

  const latest = myRuns[0];
  const visibleCases = showAllCases ? testSet.cases : testSet.cases.slice(0, DEFAULT_VISIBLE_CASES);
  const hiddenCases = Math.max(0, testSet.cases.length - DEFAULT_VISIBLE_CASES);

  return (
    <ProjectShell activeTab="test-sets">
      {/* Header */}
      <section>
        <div className="text-xs text-muted">
          <Link to="/eval/travel-agent/test-sets" className="hover:text-ink">
            Test sets
          </Link>{' '}
          / <span className="font-mono">{testSet.id}</span>
        </div>

        <div className="flex items-start justify-between gap-4 mt-1">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="font-serif text-2xl text-ink">{testSet.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Pill>{testSet.caseCount} cases</Pill>
              {latest ? (
                <Pill>
                  Last run: {latest.passed}/{latest.passed + latest.failed} passed ·{' '}
                  {relTime(latest.ranAt)}
                </Pill>
              ) : (
                <Pill muted>Never run</Pill>
              )}
              <Pill muted>{sourceLabelFor(testSet)}</Pill>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setRunOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors"
            >
              <Play className="w-4 h-4" />
              Run
            </button>
            <button
              title="Mocked in this prototype"
              className="p-2 border border-border bg-white rounded text-ink/70 cursor-default"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Cases card */}
      <section>
        <div className="bg-white border border-border rounded-lg">
          <button
            onClick={() => setCasesExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-border"
          >
            <div className="flex items-center gap-2">
              {casesExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted" />
              )}
              <h2 className="font-serif text-base text-ink">Cases</h2>
              <span className="text-xs text-muted">({testSet.cases.length})</span>
            </div>
          </button>
          {casesExpanded && (
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-chrome border-b border-border">
                  <tr>
                    <Th>Input</Th>
                    <Th>Expected behavior</Th>
                    <Th>Tags</Th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCases.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2 text-ink/90 truncate max-w-[280px]">
                        {c.inputSnippet}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted truncate max-w-[400px]">
                        {c.expectedBehavior}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] uppercase tracking-wide bg-canvas border border-border rounded px-1.5 py-0.5 text-muted"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!showAllCases && hiddenCases > 0 && (
                <button
                  onClick={() => setShowAllCases(true)}
                  className="w-full px-4 py-2 text-xs text-coral hover:text-ink bg-canvas border-t border-border transition-colors"
                >
                  Show all {testSet.cases.length}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Run history */}
      <section>
        <h2 className="font-serif text-lg text-ink mb-3">Run history</h2>
        {myRuns.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-6 text-center text-sm text-muted">
            No runs yet. Click Run to execute this test set.
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-chrome border-b border-border">
                <tr>
                  <Th>Ran</Th>
                  <Th>Model</Th>
                  <Th>Results</Th>
                  <Th>Δ vs prior</Th>
                  <Th>{''}</Th>
                </tr>
              </thead>
              <tbody>
                {myRuns.map((r) => {
                  const prior = priorRunFor(r, runs);
                  const delta = prior ? diffCounts(r, prior) : null;
                  const total = r.passed + r.failed;
                  const allPass = r.failed === 0;
                  return (
                    <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-canvas">
                      <td className="px-4 py-2 text-xs text-muted">{relTime(r.ranAt)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-ink/80">{r.model}</td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            'inline-flex items-center font-mono text-xs px-2 py-0.5 rounded ' +
                            (allPass
                              ? 'bg-node-start text-ink'
                              : 'bg-coral/15 text-coral')
                          }
                        >
                          {r.passed}/{total} passed
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {delta ? (
                          <span className="inline-flex items-center gap-2 font-mono">
                            {delta.fixed > 0 && (
                              <span className="text-success">Δ +{delta.fixed}</span>
                            )}
                            {delta.regressed > 0 && (
                              <span className="text-coral">Δ -{delta.regressed}</span>
                            )}
                            {delta.fixed === 0 && delta.regressed === 0 && (
                              <span className="text-muted">no change</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          to={`/eval/travel-agent/test-sets/${testSet.id}/runs/${r.id}`}
                          className="text-xs text-coral hover:underline"
                        >
                          View results →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* key flips on every open → remount discards stale form state without a reset effect */}
      <RunTestSetModal
        key={runOpen ? 'open' : 'closed'}
        open={runOpen}
        onClose={() => setRunOpen(false)}
        testSet={testSet}
      />
    </ProjectShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-[11px] uppercase tracking-wide text-muted font-medium px-4 py-2">
      {children}
    </th>
  );
}

function Pill({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center text-xs px-2 py-0.5 rounded border ' +
        (muted
          ? 'border-border bg-canvas text-muted'
          : 'border-border bg-white text-ink/80')
      }
    >
      {children}
    </span>
  );
}
