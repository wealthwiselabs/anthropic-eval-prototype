import { ProjectShell } from '../components/ProjectShell';
import { JudgePill } from '../components/JudgePill';
import { judges } from '../data/judges';
import type { Judge } from '../types';

// Static per-judge "agreement rate" — plausible numbers so the page reads as
// a real ops surface. Not stored on Judge type since it's purely cosmetic.
const AGREEMENT: Record<string, number> = {
  judge_tool_use_v2_1: 94,
  judge_safety_v3_0: 91,
  judge_faithfulness_v1_4: 89,
  judge_travel_task_v1_0: 92,
};

export function Judges() {
  return (
    <ProjectShell activeTab="judges">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink">Active judges ({judges.length})</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            The default bundle runs on every sampled trace. Goal-specific judges are added when
            you complete the onboarding wizard. Edit by cloning into your own custom judge.
          </p>
        </div>
        <button
          title="Mocked in this prototype"
          className="px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded cursor-default flex-shrink-0"
        >
          + Add custom judge
        </button>
      </section>

      <section className="grid grid-cols-2 gap-4">
        {judges.map((j) => (
          <JudgeCard key={j.id} judge={j} agreement={AGREEMENT[j.id] ?? 90} />
        ))}
      </section>
    </ProjectShell>
  );
}

function JudgeCard({ judge, agreement }: { judge: Judge; agreement: number }) {
  const isDefault = judge.source === 'anthropic-default';
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
            <span
              className={
                'text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded ' +
                (isDefault
                  ? 'bg-ink/5 text-ink/70'
                  : 'bg-coral/15 text-coral')
              }
            >
              {isDefault ? 'Anthropic Default' : 'Goal-specific'}
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
        <span className="text-xs text-muted">Scores per-trace</span>
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
