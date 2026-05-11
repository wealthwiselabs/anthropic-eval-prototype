import { Link, useParams } from 'react-router-dom';
import { sessionById } from '../data/sessions';
import { ProjectShell } from '../components/ProjectShell';
import { TraceCard } from '../components/TraceCard';
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
