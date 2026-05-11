import { sessions } from '../data/sessions';
import { SessionTable } from '../components/SessionTable';
import { ProjectShell } from '../components/ProjectShell';

export function SessionList() {
  return (
    <ProjectShell activeTab="sessions">
      <section>
        <h2 className="font-serif text-lg text-ink mb-3">All sessions</h2>
        <SessionTable sessions={sessions} />
      </section>
    </ProjectShell>
  );
}
