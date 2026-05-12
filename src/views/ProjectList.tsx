import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { travelAgent } from '../data/projects';
import { ConnectSelfHostedModal } from '../components/ConnectSelfHostedModal';

export function ProjectList() {
  // Local UI state — the modal is only used from this page, no need to push
  // into the global store.
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <div className="p-8 max-w-[1280px] w-full mx-auto">
      <h1 className="font-serif text-2xl text-ink mb-6">Evals · Projects</h1>

      <div className="grid grid-cols-2 gap-4 max-w-[760px]">
        <Link
          to={`/eval/${travelAgent.id}`}
          className="bg-white border border-border rounded-lg p-5 hover:border-ink/30 hover:shadow-sm transition-all flex flex-col gap-3 min-h-[180px]"
        >
          <div className="flex items-start justify-between">
            <span className="font-mono text-base text-ink">{travelAgent.name}</span>
            <span className="text-[10px] uppercase tracking-wide bg-coral/15 text-coral font-medium px-1.5 py-0.5 rounded">
              Managed Agent
            </span>
          </div>
          <div className="flex-1" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted">Session pass rate</div>
              <div className="font-serif text-xl text-ink">{Math.round(travelAgent.sessionPassRate14d * 100)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted">Sessions · 14d</div>
              <div className="font-serif text-xl text-ink">{travelAgent.sessions14d.toLocaleString()}</div>
            </div>
          </div>
        </Link>

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
