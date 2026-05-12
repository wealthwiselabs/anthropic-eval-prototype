import { NavLink, useLocation } from 'react-router-dom';
import {
  Wrench,
  Workflow,
  BarChart3,
  Code2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Box,
  Activity,
} from 'lucide-react';

// Visual-only Console nav. In this prototype the Evals subtree is the only
// interactive section; everything else is rendered for fidelity with the
// M1 Agent Builder prototype so the two demos feel like one product.
export function LeftNav() {
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-chrome flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-5 pb-3">
        <div className="font-serif text-[19px] tracking-tight text-ink">
          Claude Console
        </div>
      </div>

      <div className="px-3 pb-4">
        <button
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-white text-sm cursor-default"
          tabIndex={-1}
        >
          <span className="flex items-center gap-2">
            <Box className="w-4 h-4 text-coral" /> Default
          </span>
          <ChevronDown className="w-4 h-4 text-muted" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 text-sm">
        {/* Build is present for chrome parity with the M1 prototype but
            Agent Builder is NOT active here — this prototype's active
            surface lives under Evals. Build defaults to collapsed. */}
        <Group icon={<Wrench className="w-4 h-4" />} label="Build">
          <NavRow label="Agent Builder" badge="NEW" />
          <NavRow label="Files" />
          <NavRow label="Skills" />
          <NavRow label="Memory stores" badge="Beta" />
          <NavRow label="Batches" />
        </Group>

        {/* Evals — the new top-level group introduced by this prototype.
            Inserted between Build and Managed Agents to signal that Evals
            serves both managed and self-hosted, not a child of either.
            Judge library and Settings are org-level surfaces; Projects
            highlights for the project subtree. */}
        <Group icon={<Activity className="w-4 h-4" />} label="Evals" badge="NEW" defaultOpen>
          <NavRow label="Projects" to="/eval" linked matchPrefix="/eval/travel-agent" exactAlso="/eval" />
          <NavRow label="LLM Judges" to="/eval/judges" linked />
          <NavRow label="Settings" to="/eval/settings" linked />
        </Group>

        <Group icon={<Workflow className="w-4 h-4" />} label="Managed Agents">
          <NavRow label="Agents" />
          <NavRow label="Sessions" />
          <NavRow label="Environments" />
          <NavRow label="Credential vaults" />
        </Group>

        <Group icon={<BarChart3 className="w-4 h-4" />} label="Analytics">
          <NavRow label="Usage" />
          <NavRow label="Caching" />
          <NavRow label="Cost" />
        </Group>

        <Group icon={<Code2 className="w-4 h-4" />} label="Claude Code" />
        <Group icon={<Briefcase className="w-4 h-4" />} label="Manage" />
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted cursor-default">
          <BookOpen className="w-4 h-4" /> Documentation
        </div>
        <div className="flex items-center justify-between text-muted cursor-default">
          <span>Credits</span>
          <span className="font-mono text-xs">USD 16.66</span>
        </div>
        <div className="flex items-center gap-2 pt-2 cursor-default">
          <div className="w-8 h-8 rounded-md bg-coral/20 text-coral flex items-center justify-center font-medium">
            E
          </div>
          <div className="leading-tight">
            <div className="text-ink">Eric</div>
            <div className="text-xs text-muted">Admin · Eric's Indi…</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Group({
  icon,
  label,
  badge,
  children,
  defaultOpen,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between px-2 py-1.5 cursor-default">
        <span className="flex items-center gap-2 text-ink/85">
          {icon}
          {label}
          {badge && <Badge>{badge}</Badge>}
        </span>
        {children ? (
          defaultOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted" />
          )
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted/60" />
        )}
      </div>
      {children && defaultOpen && <div className="pl-3">{children}</div>}
    </div>
  );
}

function NavRow({
  label,
  to,
  badge,
  linked,
  matchPrefix,
  exactAlso,
}: {
  label: string;
  to?: string;
  badge?: string;
  linked?: boolean;
  matchPrefix?: string;
  // Path that should also activate this row via exact match — used by Projects
  // so it lights up on `/eval` exact AND any `/eval/travel-agent/*` path, but
  // NOT on org-level `/eval/judges` or `/eval/settings`.
  exactAlso?: string;
}) {
  const location = useLocation();
  if (linked && to) {
    const prefixActive = matchPrefix ? location.pathname.startsWith(matchPrefix) : false;
    const exactActive = exactAlso ? location.pathname === exactAlso : false;
    return (
      <NavLink
        to={to}
        end
        className={({ isActive }) => {
          const explicitActive = prefixActive || exactActive;
          const active = matchPrefix || exactAlso ? explicitActive : isActive;
          return (
            'flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ' +
            (active ? 'bg-white text-ink shadow-sm' : 'text-ink/75 hover:bg-white/60')
          );
        }}
      >
        <span>{label}</span>
        {badge && <Badge>{badge}</Badge>}
      </NavLink>
    );
  }
  return (
    <div className="flex items-center justify-between px-2 py-1.5 text-muted/90 cursor-default">
      <span>{label}</span>
      {badge && <Badge muted>{badge}</Badge>}
    </div>
  );
}

function Badge({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={
        'text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ' +
        (muted
          ? 'bg-border/50 text-muted'
          : 'bg-coral/15 text-coral font-medium')
      }
    >
      {children}
    </span>
  );
}
