import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { travelAgent } from '../data/projects';

export type ProjectTab = 'overview' | 'sessions' | 'clusters' | 'test-sets' | 'judges' | 'settings';

const TABS: { label: string; to: string; tab: ProjectTab; end?: boolean }[] = [
  { label: 'Overview', to: '/eval/travel-agent', tab: 'overview', end: true },
  { label: 'Sessions', to: '/eval/travel-agent/sessions', tab: 'sessions' },
  { label: 'Clusters', to: '/eval/travel-agent/clusters', tab: 'clusters' },
  { label: 'Test sets', to: '/eval/travel-agent/test-sets', tab: 'test-sets' },
  { label: 'LLM Judges', to: '/eval/travel-agent/judges', tab: 'judges' },
  { label: 'Settings', to: '/eval/travel-agent/settings', tab: 'settings' },
];

type Props = {
  activeTab: ProjectTab;
  children: ReactNode;
};

export function ProjectShell({ activeTab, children }: Props) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Band 1: header strip */}
      <div className="border-b border-border bg-chrome">
        <div className="max-w-[1280px] mx-auto px-8 pt-6 pb-0 w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-2 text-sm">
              <Link to="/eval" className="text-muted hover:text-ink transition-colors">
                Projects
              </Link>
              <span className="text-muted/60">/</span>
              <h1 className="font-mono text-xl text-ink">{travelAgent.name}</h1>
              <span className="text-[10px] uppercase tracking-wide bg-coral/15 text-coral font-medium px-1.5 py-0.5 rounded ml-1">
                Managed Agent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DropdownStub label="14d" />
            </div>
          </div>

          <nav className="flex items-center gap-1 mt-4 -mb-px">
            {TABS.map((tab) => {
              const isActive = tab.tab === activeTab;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={
                    'px-3 py-2 text-sm border-b-2 transition-colors ' +
                    (isActive ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink')
                  }
                >
                  {tab.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-8 py-6 w-full flex flex-col gap-8">{children}</div>
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
