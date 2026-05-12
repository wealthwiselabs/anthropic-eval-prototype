import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ConnectSelfHostedModal } from '../components/ConnectSelfHostedModal';
import { useStore } from '../store/useStore';
import type { Project } from '../types';

// Empty-state cards (sessions14d === 0) are inert: no nav, tooltip explains
// the project is still waiting for its first trace.
function EmptyProjectCard({ project }: { project: Project }) {
  return (
    <div
      title="Waiting for first trace. Setup instructions in the Connect modal."
      className="bg-white border border-border rounded-lg p-5 flex flex-col gap-3 min-h-[180px] cursor-default opacity-90"
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-base text-ink">{project.name}</span>
        <span className="text-[10px] uppercase tracking-wide bg-muted/15 text-muted font-medium px-1.5 py-0.5 rounded">
          Waiting
        </span>
      </div>
      <div className="text-xs text-muted">
        Waiting for first trace from <span className="font-mono">{project.name}</span>...
      </div>
      <div className="flex-1" />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-muted">Session pass rate</div>
          <div className="font-serif text-xl text-ink">—</div>
        </div>
        <div>
          <div className="text-xs text-muted">Sessions · 14d</div>
          <div className="font-serif text-xl text-ink">0</div>
        </div>
      </div>
    </div>
  );
}

function PopulatedProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/eval/${project.id}`}
      className="bg-white border border-border rounded-lg p-5 hover:border-ink/30 hover:shadow-sm transition-all flex flex-col gap-3 min-h-[180px]"
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-base text-ink">{project.name}</span>
        <span className="text-[10px] uppercase tracking-wide bg-coral/15 text-coral font-medium px-1.5 py-0.5 rounded">
          {project.type === 'managed' ? 'Managed Agent' : 'Self-hosted'}
        </span>
      </div>
      <div className="flex-1" />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs text-muted">Session pass rate</div>
          <div className="font-serif text-xl text-ink">{Math.round(project.sessionPassRate14d * 100)}%</div>
        </div>
        <div>
          <div className="text-xs text-muted">Sessions · 14d</div>
          <div className="font-serif text-xl text-ink">{project.sessions14d.toLocaleString()}</div>
        </div>
      </div>
    </Link>
  );
}

export function ProjectList() {
  // Local UI state — the modal is only used from this page, no need to push
  // into the global store.
  const [connectOpen, setConnectOpen] = useState(false);
  const projects = useStore((s) => s.projects);

  return (
    <div className="p-8 max-w-[1280px] w-full mx-auto">
      <h1 className="font-serif text-2xl text-ink mb-6">Evals · Projects</h1>

      <div className="grid grid-cols-2 gap-4 max-w-[760px]">
        {projects.map((p) =>
          p.sessions14d === 0 ? (
            <EmptyProjectCard key={p.id} project={p} />
          ) : (
            <PopulatedProjectCard key={p.id} project={p} />
          )
        )}

        <button
          type="button"
          onClick={() => setConnectOpen(true)}
          className="bg-canvas border border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[180px] cursor-pointer hover:border-ink/40 hover:bg-chrome transition-all"
        >
          <Plus className="w-6 h-6 text-muted" />
          <div className="text-sm text-ink/80 font-medium">Connect a self-hosted agent</div>
          <div className="text-xs text-muted max-w-[220px]">
            Add a self-hosted agent via <span className="font-mono">metadata.agent_name</span>
          </div>
        </button>
      </div>

      <ConnectSelfHostedModal open={connectOpen} onClose={() => setConnectOpen(false)} />
    </div>
  );
}
