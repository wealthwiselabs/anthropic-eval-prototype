import { Link } from 'react-router-dom';
import { ProjectShell } from '../components/ProjectShell';
import { JudgePill } from '../components/JudgePill';
import { judges } from '../data/judges';
import type { Judge } from '../types';

// Static per-judge "agreement rate" — plausible numbers so the page reads as
// a real ops surface. Not stored on Judge type since it's purely cosmetic.
const AGREEMENT: Record<string, number> = {
  judge_tool_use_v2_1: 94,
  judge_safety_v3_0: 91,
  judge_groundedness_v1_4: 89,
  judge_travel_task_v1_0: 92,
};

// Project-level Judges page: which judges actively score this project's
// traces. Split into "From org library" (Anthropic Defaults pulled from the
// catalog) and "Project-specific" (goal-specific judges authored by the
// project wizard). Cloning happens at org level, so cards here link out to
// the library rather than offer clone.
export function Judges() {
  const fromLibrary = judges.filter((j) => j.source === 'anthropic-default');
  const projectSpecific = judges.filter((j) => j.source === 'goal-specific');

  return (
    <ProjectShell activeTab="judges">
      <section>
        <h1 className="font-serif text-2xl text-ink">LLM Judges for travel-agent</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Judges active for this project. Each judge returns PASS or FAIL per trace;
          a trace passes only if every active judge returns PASS. Manage the org library at{' '}
          <Link to="/eval/judges" className="text-coral hover:underline">
            LLM Judges
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg text-ink">From org library ({fromLibrary.length})</h2>
        <div className="grid grid-cols-2 gap-4">
          {fromLibrary.map((j) => (
            <FromLibraryCard key={j.id} judge={j} agreement={AGREEMENT[j.id] ?? 90} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg text-ink">Project-specific ({projectSpecific.length})</h2>
        <div className="grid grid-cols-2 gap-4">
          {projectSpecific.map((j) => (
            <ProjectSpecificCard key={j.id} judge={j} agreement={AGREEMENT[j.id] ?? 90} />
          ))}
        </div>
      </section>
    </ProjectShell>
  );
}

function FromLibraryCard({ judge, agreement }: { judge: Judge; agreement: number }) {
  return (
    <div className="bg-white border border-border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-lg text-ink">{judge.name}</h3>
            <span className="text-[10px] uppercase tracking-wide bg-canvas border border-border text-muted font-mono px-1.5 py-0.5 rounded">
              {judge.version}
            </span>
            <span className="text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-ink/5 text-ink/70">
              {judge.scope === 'turn' ? 'Per-turn' : 'Per-session'}
            </span>
          </div>
          <div className="mt-1.5">
            <span className="text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-ink/5 text-ink/70">
              From library
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-muted">Agreement</div>
          <div className="font-mono text-sm text-ink">{agreement}%</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <JudgePill dimension={judge.dimension} />
        <span className="text-xs text-muted">
          Returns PASS or FAIL per {judge.scope === 'turn' ? 'trace' : 'session'}
        </span>
      </div>

      <p className="text-sm text-ink/80 leading-relaxed">{judge.description}</p>

      <div className="flex items-center justify-end pt-2 border-t border-border">
        <Link
          to="/eval/judges"
          className="px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded hover:bg-canvas transition-colors"
        >
          View in library
        </Link>
      </div>
    </div>
  );
}

function ProjectSpecificCard({ judge, agreement }: { judge: Judge; agreement: number }) {
  return (
    <div className="bg-white border border-border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-lg text-ink">{judge.name}</h3>
            <span className="text-[10px] uppercase tracking-wide bg-canvas border border-border text-muted font-mono px-1.5 py-0.5 rounded">
              {judge.version}
            </span>
            <span className="text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-ink/5 text-ink/70">
              {judge.scope === 'turn' ? 'Per-turn' : 'Per-session'}
            </span>
          </div>
          <div className="mt-1.5">
            <span className="text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-coral/15 text-coral">
              Goal-specific
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-muted">Agreement</div>
          <div className="font-mono text-sm text-ink">{agreement}%</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <JudgePill dimension={judge.dimension} />
        <span className="text-xs text-muted">
          Returns PASS or FAIL per {judge.scope === 'turn' ? 'trace' : 'session'}
        </span>
      </div>

      <p className="text-sm text-ink/80 leading-relaxed">{judge.description}</p>

      <div className="flex items-center justify-end pt-2 border-t border-border">
        <button
          title="Mocked in this prototype"
          className="px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded cursor-default"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
