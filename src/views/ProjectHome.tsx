import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { travelAgent } from '../data/projects';
import { clusters } from '../data/clusters';
import { sessions } from '../data/sessions';
import { KPITile } from '../components/KPITile';
import { ClusterCard } from '../components/ClusterCard';
import { SessionTable } from '../components/SessionTable';

const TABS: { label: string; to: string; end?: boolean }[] = [
  { label: 'Overview', to: '/eval/travel-agent', end: true },
  { label: 'Sessions', to: '/eval/travel-agent/sessions' },
  { label: 'Clusters', to: '/eval/travel-agent/clusters' },
  { label: 'Test sets', to: '/eval/travel-agent/test-sets' },
  { label: 'CI', to: '/eval/travel-agent/ci' },
  { label: 'Judges', to: '/eval/travel-agent/judges' },
  { label: 'Settings', to: '/eval/travel-agent/settings' },
];

export function ProjectHome() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col">
      {/* Band 1: header strip */}
      <div className="border-b border-border bg-chrome">
        <div className="max-w-[1280px] mx-auto px-8 pt-6 pb-0 w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-xl text-ink">{travelAgent.name}</h1>
              <span className="text-[10px] uppercase tracking-wide bg-coral/15 text-coral font-medium px-1.5 py-0.5 rounded">
                Managed Agent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DropdownStub label="Agent" />
              <DropdownStub label="14d" />
              <button
                title="Open Test Sets"
                onClick={() => navigate('/eval/travel-agent/test-sets')}
                className="px-3 py-1.5 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors"
              >
                Run test sets
              </button>
            </div>
          </div>

          <nav className="flex items-center gap-1 mt-4 -mb-px">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  'px-3 py-2 text-sm border-b-2 transition-colors ' +
                  (isActive ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink')
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-8 py-6 w-full flex flex-col gap-8">
        {/* Band 2: health KPIs */}
        <section className="grid grid-cols-4 gap-4">
          <KPITile
            label="Pass rate"
            value={`${Math.round(travelAgent.passRate14d * 100)}%`}
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
                onSave={() => alert('Save flow lands in Task 3')}
              />
            ))}
          </div>
        </section>

        {/* Band 4: recent sessions */}
        <section>
          <h2 className="font-serif text-lg text-ink mb-3">Recent sessions</h2>
          <SessionTable sessions={sessions} limit={20} />
        </section>
      </div>
    </div>
  );
}

function DropdownStub({ label }: { label: string }) {
  return (
    <button
      title="Mocked in this prototype"
      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm border border-border bg-white rounded cursor-default text-ink/80"
    >
      {label}
      <ChevronDown className="w-3.5 h-3.5 text-muted" />
    </button>
  );
}
