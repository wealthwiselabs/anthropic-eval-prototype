import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown } from 'lucide-react';
import { ProjectShell } from '../components/ProjectShell';
import { SaveAsTestSetModal } from '../components/SaveAsTestSetModal';
import { useSaveClusterModal } from '../components/useSaveClusterModal';
import { useStore } from '../store/useStore';
import { clusters } from '../data/clusters';
import { relTime } from '../lib/time';
import type { TestSet, Run } from '../types';

// Find the most recent run for a test set in the runs store
function latestRunFor(testSetId: string, runs: Run[]): Run | undefined {
  return runs
    .filter((r) => r.testSetId === testSetId)
    .sort((a, b) => (a.ranAt < b.ranAt ? 1 : -1))[0];
}

// Sort: from-cluster first (newest first), then seeded sets last.
// Matches the demo expectation that a freshly-saved cluster lands at the top.
function sortTestSets(sets: TestSet[]): TestSet[] {
  return [...sets].sort((a, b) => {
    if (a.source !== b.source) return a.source === 'from-cluster' ? -1 : 1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export function TestSetList() {
  const navigate = useNavigate();
  const testSets = useStore((s) => s.testSets);
  const runs = useStore((s) => s.runs);
  const modal = useSaveClusterModal();
  const sorted = useMemo(() => sortTestSets(testSets), [testSets]);

  return (
    <ProjectShell activeTab="test-sets">
      {/* Page header + primary CTA */}
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink">Test sets</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Run any test set against a prompt or model to catch regressions before deploy.
          </p>
        </div>
        <NewFromClusterMenu onPick={(c) => modal.openWith(c)} />
      </section>

      {/* Test sets table */}
      <section>
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-chrome border-b border-border">
              <tr>
                <Th>Name</Th>
                <Th>Cases</Th>
                <Th>Source</Th>
                <Th>Last run</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ts) => {
                const latest = latestRunFor(ts.id, runs);
                const sourceLabel = sourceLabelFor(ts);
                return (
                  <tr
                    key={ts.id}
                    onClick={() => navigate(`/eval/travel-agent/test-sets/${ts.id}`)}
                    className="border-b border-border last:border-b-0 hover:bg-canvas cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-ink">{ts.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink/80">{ts.caseCount}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{sourceLabel}</td>
                    <td className="px-4 py-2.5 text-xs">
                      {latest ? (
                        <span className="text-ink/80">
                          <span className="font-mono">
                            {latest.passed}/{latest.passed + latest.failed} passed
                          </span>
                          <span className="text-muted"> · {relTime(latest.ranAt)}</span>
                        </span>
                      ) : (
                        <span className="text-muted">Never run</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted">{relTime(ts.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <SaveAsTestSetModal open={modal.open} sourceCluster={modal.cluster} onClose={modal.close} />
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

function sourceLabelFor(ts: TestSet): string {
  if (ts.source === 'seeded') return 'Seeded';
  const cluster = clusters.find((c) => c.id === ts.sourceClusterId);
  return cluster ? `From cluster: ${cluster.title}` : 'From cluster';
}

// Dropdown that lets the user pick which cluster to save as a test set from
// the Test Sets page (rather than only via cluster detail / project home).
function NewFromClusterMenu({ onPick }: { onPick: (cluster: typeof clusters[number]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New from cluster
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-[340px] bg-white border border-border rounded-lg shadow-lg z-10 overflow-hidden">
          {clusters.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setOpen(false);
                onPick(c);
              }}
              className="w-full text-left px-3 py-2 hover:bg-canvas border-b border-border last:border-b-0 flex flex-col gap-0.5"
            >
              <span className="text-sm text-ink leading-tight">{c.title}</span>
              <span className="text-[11px] text-muted">
                {c.dimension} · {c.count} traces
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
