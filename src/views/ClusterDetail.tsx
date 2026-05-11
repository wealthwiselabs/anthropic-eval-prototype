import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { clusters } from '../data/clusters';
import { traceById } from '../data/sessions';
import { ProjectShell } from '../components/ProjectShell';
import { JudgePill } from '../components/JudgePill';
import { TrendArrow } from '../components/TrendArrow';
import { TraceCard } from '../components/TraceCard';
import { SaveAsTestSetModal } from '../components/SaveAsTestSetModal';
import { useSaveClusterModal } from '../components/useSaveClusterModal';
import { relTime } from '../lib/time';

type Tab = 'representative' | 'all' | 'reasoning';

const TABS: { id: Tab; label: string }[] = [
  { id: 'representative', label: 'Representative traces' },
  { id: 'all', label: 'All traces' },
  { id: 'reasoning', label: 'Judge reasoning' },
];

export function ClusterDetail() {
  const { id } = useParams<{ id: string }>();
  const cluster = clusters.find((c) => c.id === id);
  const [tab, setTab] = useState<Tab>('representative');
  const modal = useSaveClusterModal();

  const exampleTraces = useMemo(() => {
    if (!cluster) return [];
    return cluster.exampleTraceIds
      .map((tid) => traceById[tid])
      .filter((hit): hit is NonNullable<typeof hit> => !!hit);
  }, [cluster]);

  if (!cluster) {
    return (
      <ProjectShell activeTab="clusters">
        <div className="text-sm text-muted">
          Cluster not found.{' '}
          <Link to="/eval/travel-agent/clusters" className="text-coral hover:underline">
            Back to clusters
          </Link>
        </div>
      </ProjectShell>
    );
  }

  const extraCount = Math.max(0, cluster.count - exampleTraces.length);

  // Deduplicate reasoning strings from failed scores across example traces
  // so the "Judge reasoning" tab shows the unique pattern variants.
  const reasoningExcerpts = Array.from(
    new Set(
      exampleTraces.flatMap((hit) =>
        hit.trace.scores.filter((s) => s.verdict === 'fail' && s.reasoning).map((s) => s.reasoning as string),
      ),
    ),
  );

  return (
    <ProjectShell activeTab="clusters">
      {/* Top header */}
      <section>
        <div className="text-xs text-muted">
          <Link to="/eval/travel-agent/clusters" className="hover:text-ink">
            Clusters
          </Link>{' '}
          / <span className="font-mono">{cluster.id}</span>
        </div>
        <h1 className="font-serif text-2xl text-ink mt-1">{cluster.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <JudgePill dimension={cluster.dimension} verdict="fail" size="md" />
          <span className="font-mono text-sm text-ink">{cluster.count} traces</span>
          <span className="text-muted">·</span>
          <TrendArrow trend={cluster.trend7d} />
        </div>
        <p className="text-sm text-muted leading-relaxed mt-3 max-w-3xl">{cluster.description}</p>
      </section>

      {/* Two-column body: tabs + right rail */}
      <section className="grid grid-cols-[1fr_280px] gap-6 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          {/* Tab strip */}
          <div className="border-b border-border flex items-center gap-1">
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={
                    'px-3 py-2 text-sm border-b-2 -mb-px transition-colors ' +
                    (active
                      ? 'border-ink text-ink'
                      : 'border-transparent text-muted hover:text-ink')
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'representative' && (
            <div className="flex flex-col gap-4">
              {exampleTraces.map((hit) => (
                <TraceCard
                  key={hit.trace.id}
                  trace={hit.trace}
                  sessionId={hit.sessionId}
                  defaultExpanded
                />
              ))}
            </div>
          )}

          {tab === 'all' && (
            <div className="bg-white border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-chrome border-b border-border">
                  <tr>
                    <th className="text-left text-[11px] uppercase tracking-wide text-muted font-medium px-4 py-2">
                      trace_id
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-muted font-medium px-4 py-2">
                      when
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-muted font-medium px-4 py-2">
                      input
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exampleTraces.map((hit) => (
                    <tr key={hit.trace.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2 font-mono text-[11px] text-ink/80 whitespace-nowrap">
                        <Link
                          to={`/eval/travel-agent/sessions/${hit.sessionId}`}
                          className="hover:text-coral"
                        >
                          {hit.trace.id}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted whitespace-nowrap">
                        {relTime(hit.trace.timestamp)}
                      </td>
                      <td className="px-4 py-2 text-sm text-ink truncate max-w-[480px]">
                        {hit.trace.inputPreview}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {extraCount > 0 && (
                <div className="px-4 py-2 text-xs text-muted bg-canvas border-t border-border">
                  ...and {extraCount} more similar traces matching this cluster pattern.
                </div>
              )}
            </div>
          )}

          {tab === 'reasoning' && (
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-border rounded-lg p-4">
                <h3 className="font-serif text-base text-ink mb-2">Aggregate pattern</h3>
                <p className="text-sm text-ink/80 leading-relaxed">{cluster.description}</p>
              </div>
              <div>
                <h3 className="font-serif text-base text-ink mb-2">
                  Unique reasoning from example traces
                </h3>
                <div className="flex flex-col gap-2">
                  {reasoningExcerpts.map((r, i) => (
                    <blockquote
                      key={i}
                      className="border-l-2 border-coral bg-coral/5 px-3 py-2 text-sm text-ink/80 italic leading-relaxed"
                    >
                      {r}
                    </blockquote>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right rail */}
        <aside className="sticky top-6 flex flex-col gap-2">
          <button
            onClick={() => modal.openWith(cluster)}
            className="w-full px-3 py-2 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors"
          >
            Save cluster as test set
          </button>
          <button
            title="Mocked in this prototype"
            className="w-full px-3 py-2 text-sm border border-border bg-white text-ink/70 rounded cursor-default"
          >
            Mute cluster
          </button>
          <button
            title="Mocked in this prototype"
            className="w-full px-3 py-2 text-sm border border-border bg-white text-ink/70 rounded cursor-default"
          >
            Export as JSON
          </button>
        </aside>
      </section>

      <SaveAsTestSetModal open={modal.open} sourceCluster={modal.cluster} onClose={modal.close} />
    </ProjectShell>
  );
}
