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
      <section className="grid grid-cols-4 gap-4">
        <KPITile
          label="Session pass rate"
          value={`${Math.round(travelAgent.sessionPassRate14d * 100)}%`}
          sublabel="last 14 days"
          sparkline={travelAgent.passRateHistory}
        />
        <KPITile
          label="Traces sampled"
          value={travelAgent.tracesSampled14d.toLocaleString()}
          sublabel="last 14 days"
        />
        <KPITile label="Active clusters" value={String(travelAgent.clusterCount)} sublabel="needs review" />
        <KPITile label="Eval cost (MTD)" value={`$${travelAgent.evalCostMTD.toFixed(2)}`} sublabel="5% of API spend" />
      </section>

      {/* Band 3: failure clusters */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg text-ink">Failure clusters</h2>
          <NavLink to="/eval/travel-agent/clusters" className="text-sm text-ink/80 hover:text-ink">
            View all →
          </NavLink>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {clusters.map((c) => (
            <ClusterCard
              key={c.id}
              cluster={c}
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
