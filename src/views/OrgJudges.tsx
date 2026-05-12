import { useState } from 'react';
import { JudgePill } from '../components/JudgePill';
import { EditJudgeModal } from '../components/EditJudgeModal';
import { judges } from '../data/judges';
import { useStore } from '../store/useStore';
import type { Judge } from '../types';

// Stub judge passed into EditJudgeModal when creating a brand-new custom judge.
// Sentinel id `new` triggers the modal's create-mode UI (title, save copy,
// starter prompt template).
const NEW_JUDGE_STUB: Judge = {
  id: 'new',
  name: '',
  version: 'v1.0',
  dimension: 'task-completion',
  description: '',
  source: 'custom',
  scope: 'turn',
};

// Static per-judge "Used in N projects" stat. Org-level page shows reuse
// across projects rather than the per-project agreement rate that lives on
// the project Judges page.
const USED_IN_PROJECTS: Record<string, number> = {
  judge_tool_use_v2_1: 1,
  judge_safety_v3_0: 1,
  judge_groundedness_v1_4: 1,
};

// Org-level Judge library — the catalog of reusable judges across all eval
// projects. Anthropic Defaults are seeded; Custom judges live in the Zustand
// store and are added/edited via EditJudgeModal. Goal-specific judges (e.g.
// Travel-task completion) belong to projects, not to this library.
export function OrgJudges() {
  const defaultJudges = judges.filter((j) => j.source === 'anthropic-default');
  const customJudges = useStore((s) => s.customJudges);
  // Single state slot drives both create flow (sentinel stub) and edit flow
  // (real custom judge) — the modal branches on judge.id === 'new'.
  const [activeJudge, setActiveJudge] = useState<Judge | null>(null);

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
          onClick={() => setActiveJudge(NEW_JUDGE_STUB)}
          className="px-3 py-1.5 text-sm border border-ink/80 text-ink rounded hover:bg-ink hover:text-white transition-colors flex-shrink-0"
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
        <h2 className="font-serif text-lg text-ink">Custom ({customJudges.length})</h2>
        {customJudges.length === 0 ? (
          <div className="bg-canvas border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="text-sm text-ink/80 font-medium">No custom judges yet.</div>
            <div className="text-sm text-muted max-w-md">
              Clone an Anthropic Default to create your own, or start from scratch.
            </div>
            <button
              onClick={() => setActiveJudge(NEW_JUDGE_STUB)}
              className="mt-2 px-3 py-1.5 text-sm border border-ink/80 text-ink rounded hover:bg-ink hover:text-white transition-colors"
            >
              + New custom judge
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {customJudges.map((j) => (
              <CustomJudgeCard key={j.id} judge={j} onEdit={() => setActiveJudge(j)} />
            ))}
          </div>
        )}
      </section>

      {activeJudge && (
        <EditJudgeModal open onClose={() => setActiveJudge(null)} judge={activeJudge} />
      )}
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
            {/* Scope badge sits adjacent to version so the per-turn vs
                per-session distinction reads as part of the judge's identity. */}
            <span className="text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded bg-ink/5 text-ink/70">
              {judge.scope === 'turn' ? 'Per-turn' : 'Per-session'}
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
          Clone to customize
        </button>
      </div>
    </div>
  );
}

// Mirrors DefaultJudgeCard layout but drops the coral "Provider: Anthropic"
// badge for a muted "Custom" tag and swaps the disabled Clone CTA for an
// active Edit button. "Used in" is hard-coded to 0 because the prototype
// doesn't attach custom judges to projects.
function CustomJudgeCard({ judge, onEdit }: { judge: Judge; onEdit: () => void }) {
  const description =
    judge.description || 'Custom judge defined via the org Judge library.';
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
              Custom
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-muted">Used in</div>
          <div className="font-mono text-sm text-ink">0 projects</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <JudgePill dimension={judge.dimension} />
        <span className="text-xs text-muted">
          Returns PASS or FAIL per {judge.scope === 'turn' ? 'trace' : 'session'}
        </span>
      </div>

      <p className="text-sm text-ink/80 leading-relaxed">{description}</p>

      <div className="flex items-center justify-end pt-2 border-t border-border">
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm border border-ink/80 text-ink rounded hover:bg-ink hover:text-white transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
