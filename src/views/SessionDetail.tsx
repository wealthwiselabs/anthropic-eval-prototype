import { Link, useParams } from 'react-router-dom';
import { sessionById } from '../data/sessions';
import { ProjectShell } from '../components/ProjectShell';
import { TraceCard } from '../components/TraceCard';
import { JudgePill } from '../components/JudgePill';
import { OverallVerdictPill } from '../components/OverallVerdictPill';
import { sessionVerdict } from '../lib/verdict';
import { relTime } from '../lib/time';

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const session = id ? sessionById[id] : undefined;

  if (!session) {
    return (
      <ProjectShell activeTab="sessions">
        <div className="text-sm text-muted">
          Session not found.{' '}
          <Link to="/eval/travel-agent/sessions" className="text-coral hover:underline">
            Back to sessions
          </Link>
        </div>
      </ProjectShell>
    );
  }

  // Default-expand the first failing turn (if any) so the reviewer lands on the
  // most interesting card without hunting.
  const firstFailIdx = session.traces.findIndex((t) =>
    t.scores.some((s) => s.verdict === 'fail'),
  );

  return (
    <ProjectShell activeTab="sessions">
      <section>
        <div className="text-xs text-muted">
          <Link to="/eval/travel-agent/sessions" className="hover:text-ink">
            Sessions
          </Link>{' '}
          / <span className="font-mono">{session.id}</span>
        </div>
        <h1 className="font-mono text-lg text-ink mt-1 break-all">{session.id}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted mt-2">
          <span>{relTime(session.startedAt)}</span>
          <span>
            <span className="font-mono text-ink/80">{session.turns}</span> turns
          </span>
          <span className="font-mono">{session.userIdHash}</span>
        </div>
      </section>

      {/* Session-level evaluation band: per-session judges (e.g. task-completion)
          plus the overall verdict that combines session + per-turn results.
          Sits between the page header and the trace stack so reviewers see the
          end-state outcome before scanning individual turns. */}
      <section className="bg-white border border-border rounded-lg p-4 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-[11px] uppercase tracking-wide text-muted">
            Session-level judges
          </h2>
          <div className="mt-2 flex flex-col gap-2">
            {session.sessionScores.map((score, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <JudgePill dimension={score.dimension} size="sm" />
                  <OverallVerdictPill passed={score.verdict === 'pass'} size="sm" />
                </div>
                {score.verdict === 'fail' && score.reasoning && (
                  <blockquote className="border-l-2 border-coral bg-coral/5 px-3 py-2 text-xs text-ink/80 italic leading-relaxed">
                    {score.reasoning}
                  </blockquote>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <OverallVerdictPill passed={sessionVerdict(session) === 'pass'} size="md" />
          <span className="text-[11px] text-muted text-right max-w-[180px] leading-snug">
            Computed from session-level judges AND every turn's per-turn judges.
          </span>
        </div>
      </section>

      <section className="grid grid-cols-[1fr_280px] gap-6 items-start">
        <div className="flex flex-col gap-3 min-w-0">
          {session.traces.map((trace, i) => (
            <TraceCard
              key={trace.id}
              trace={trace}
              defaultExpanded={i === firstFailIdx}
            />
          ))}
        </div>

        <aside className="sticky top-6 flex flex-col gap-2">
          <button
            title="Mocked in this prototype"
            className="w-full px-3 py-2 text-sm border border-border bg-white text-ink/70 rounded cursor-default"
          >
            Add this session to a test set
          </button>
        </aside>
      </section>
    </ProjectShell>
  );
}
