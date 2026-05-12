import { NavLink, useNavigate } from 'react-router-dom';
import { travelAgent } from '../data/projects';
import { clusters } from '../data/clusters';
import { sessions } from '../data/sessions';
import { suggestions } from '../data/suggestions';
import { KPITile } from '../components/KPITile';
import { ClusterCard } from '../components/ClusterCard';
import { SessionTable } from '../components/SessionTable';
import { ProjectShell } from '../components/ProjectShell';
import { SaveAsTestSetModal } from '../components/SaveAsTestSetModal';
import { SuggestionCard } from '../components/SuggestionCard';
import { useSaveClusterModal } from '../components/useSaveClusterModal';

export function ProjectHome() {
  const navigate = useNavigate();
  const modal = useSaveClusterModal();

  return (
    <ProjectShell activeTab="overview">
      {/* Band 2: health KPIs */}
      <section className="grid grid-cols-5 gap-3">
        <KPITile
          label="Session pass rate"
          value={`${Math.round(travelAgent.sessionPassRate14d * 100)}%`}
          sublabel="last 14 days"
          sparkline={travelAgent.passRateHistory.map((p) => ({ day: p.day, value: p.rate }))}
        />
        <KPITile
          label="Sessions · 14d"
          value={travelAgent.sessions14d.toLocaleString()}
          sublabel="last 14 days"
          sparkline={travelAgent.sessions14dHistory}
          formatValue={(v) => v.toLocaleString()}
        />
        <KPITile
          label="Latency (P95)"
          value={`${(travelAgent.latencyP95Ms14d / 1000).toFixed(1)}s`}
          subStats={[
            { label: 'P90', value: `${(travelAgent.latencyP90Ms14d / 1000).toFixed(1)}s` },
            { label: 'P80', value: `${(travelAgent.latencyP80Ms14d / 1000).toFixed(1)}s` },
          ]}
          sparkline={travelAgent.latencyP95History}
          formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
        />
        <KPITile
          label="Session cost (P95)"
          value={`$${travelAgent.sessionCostP95.toFixed(3)}`}
          subStats={[
            { label: 'P90', value: `$${travelAgent.sessionCostP90.toFixed(3)}` },
            { label: 'P80', value: `$${travelAgent.sessionCostP80.toFixed(3)}` },
          ]}
          sparkline={travelAgent.sessionCostP95History}
          formatValue={(v) => `$${v.toFixed(3)}`}
        />
        <KPITile
          label="Eval cost"
          value={`$${travelAgent.evalCostMTD.toFixed(2)}`}
          sublabel="month-to-date · 5% of API spend"
        />
      </section>

      {/* Band 3: failure clusters */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg text-ink">
            Failure clusters <span className="text-muted font-sans text-base">({clusters.length})</span>
          </h2>
          <NavLink to="/eval/travel-agent/clusters" className="text-sm text-ink/80 hover:text-ink">
            View all →
          </NavLink>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {clusters.map((c) => (
            <ClusterCard
              key={c.id}
              cluster={c}
              compact
              onView={() => navigate(`/eval/travel-agent/clusters/${c.id}`)}
              onSave={() => modal.openWith(c)}
            />
          ))}
        </div>
      </section>

      {/* Band 4: suggested improvements (Eval → Builder handoff) */}
      <section>
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Suggested improvements</h2>
          <span className="text-xs text-muted">Generated from your last 14 days of eval data.</span>
        </header>
        <div className="grid grid-cols-3 gap-4">
          {suggestions.map((s) => {
            const cluster = clusters.find((c) => c.id === s.clusterId);
            return <SuggestionCard key={s.id} suggestion={s} cluster={cluster} />;
          })}
        </div>
      </section>

      {/* Band 5: recent sessions */}
      <section>
        <h2 className="font-serif text-lg text-ink mb-3">Recent sessions</h2>
        <SessionTable sessions={sessions} limit={20} />
      </section>

      <SaveAsTestSetModal open={modal.open} sourceCluster={modal.cluster} onClose={modal.close} />
    </ProjectShell>
  );
}
