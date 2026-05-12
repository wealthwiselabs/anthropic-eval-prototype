import { JudgePill } from '../components/JudgePill';
import { judges } from '../data/judges';
import type { Judge } from '../types';

// Static per-judge "Used in N projects" stat. Org-level page shows reuse
// across projects rather than the per-project agreement rate that lives on
// the project Judges page.
const USED_IN_PROJECTS: Record<string, number> = {
  judge_tool_use_v2_1: 1,
  judge_safety_v3_0: 1,
  judge_faithfulness_v1_4: 1,
};

// Org-level Judge library — the catalog of reusable judges across all eval
// projects. Anthropic Defaults are seeded; Custom judges are user-cloned and
// edited (empty in the prototype). Goal-specific judges (e.g. Travel-task
// completion) belong to projects, not to this library, so they're filtered out.
export function OrgJudges() {
  const defaultJudges = judges.filter((j) => j.source === 'anthropic-default');

  return (
    <div className="p-8 max-w-[1280px] w-full mx-auto flex flex-col gap-8">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink">LLM Judges</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Reusable judges across all eval projects in this org.
          </p>
        </div>
        <button
          title="Mocked in this prototype"
          className="px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded cursor-default flex-shrink-0"
        >
          + New custom judge
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg text-ink">Anthropic Default</h2>
        <div className="grid grid-cols-2 gap-4">
          {defaultJudges.map((j) => (
            <DefaultJudgeCard key={j.id} judge={j} usedIn={USED_IN_PROJECTS[j.id] ?? 1} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg text-ink">Custom (0)</h2>
        <div className="bg-canvas border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-sm text-ink/80 font-medium">No custom judges yet.</div>
          <div className="text-sm text-muted max-w-md">
            Clone an Anthropic Default to create your own, or start from scratch.
          </div>
          <button
            title="Mocked in this prototype"
            className="mt-2 px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded cursor-default"
          >
            + New custom judge
          </button>
        </div>
      </section>
    </div>
  );
}

function DefaultJudgeCard({ judge, usedIn }: { judge: Judge; usedIn: number }) {
  return (
    <div className="bg-white border border-border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-lg text-ink">{judge.name}</h3>
            <span className="text-[10px] uppercase tracking-wide bg-canvas border border-border text-muted font-mono px-1.5 py-0.5 rounded">
              {judge.version}
            </span>
          </div>
          <div className="mt-1.5">
            {/* Coral badge signals first-party authorship — frames Anthropic as
                the provider/publisher (same language used by dev tool catalogs
                like npm/VSCode) rather than the softer "curated". */}
            <span className="text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-coral/15 text-coral">
              Provider: Anthropic
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-muted">Used in</div>
          <div className="font-mono text-sm text-ink">
            {usedIn} project{usedIn === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <JudgePill dimension={judge.dimension} />
        <span className="text-xs text-muted">Returns PASS or FAIL per trace</span>
      </div>

      <p className="text-sm text-ink/80 leading-relaxed">{judge.description}</p>

      <div className="flex items-center justify-end pt-2 border-t border-border">
        <button
          title="Mocked in this prototype"
          className="px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded cursor-default"
        >
          Clone to customize
        </button>
      </div>
    </div>
  );
}
