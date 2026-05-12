import { useState } from 'react';
import { Check, Copy, X, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProjectShell } from '../components/ProjectShell';
import { Modal } from '../components/Modal';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { YamlSnippet } from '../components/YamlSnippet';
import { useStore } from '../store/useStore';
import type { RetentionDays, AgentType } from '../store/useStore';

// Static SDK snippet — the canonical metadata pattern we recommend developers
// pass into every Messages.create call so we can stitch traces into sessions.
const SDK_SNIPPET = `client.messages.create({
  model: "claude-opus-4-7",
  messages: [...],
  metadata: {
    session_id: "sess_...",
    agent_name: "travel-agent",
    user_id: "..."  // hashed server-side
  }
});`;

const RETENTION_OPTIONS: RetentionDays[] = [30, 90, 180];

const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  support: 'Support',
  code: 'Code assistant',
  rag: 'RAG / Q&A',
  travel: 'Travel',
  other: 'Other',
};

export function Settings() {
  const evalEnabled = useStore((s) => s.evalEnabled);
  const setEvalEnabled = useStore((s) => s.setEvalEnabled);
  const agentType = useStore((s) => s.agentType);
  const setAgentType = useStore((s) => s.setAgentType);
  const retentionDays = useStore((s) => s.retentionDays);
  const setRetentionDays = useStore((s) => s.setRetentionDays);
  const orgEvalEnabled = useStore((s) => s.orgEvalEnabled);
  const orgDefaultRetentionDays = useStore((s) => s.orgDefaultRetentionDays);
  const showToast = useStore((s) => s.showToast);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [confirmOffOpen, setConfirmOffOpen] = useState(false);

  function handleToggle() {
    // Toggle is disabled when org-wide Evals is OFF, so this only fires when
    // the org switch is on. The OFF→ON path still launches the wizard.
    if (evalEnabled) {
      setConfirmOffOpen(true);
    } else {
      setWizardOpen(true);
    }
  }

  function confirmTurnOff() {
    setEvalEnabled(false);
    setConfirmOffOpen(false);
    showToast('Evals ingestion turned off');
  }

  const retentionMatchesOrg = retentionDays === orgDefaultRetentionDays;
  const toggleDisabled = !orgEvalEnabled;

  return (
    <ProjectShell activeTab="settings">
      <section>
        <h1 className="font-serif text-2xl text-ink">travel-agent settings</h1>
        <p className="text-sm text-muted mt-1">
          Project-level overrides. Org defaults are managed in{' '}
          <Link to="/eval/settings" className="text-coral hover:underline">
            Org Settings
          </Link>
          .
        </p>
      </section>

      {/* Banner: only when org-wide Evals is OFF — explains why the toggle below is disabled. */}
      {!orgEvalEnabled && (
        <section className="bg-coral/10 border border-coral/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
          <div className="text-sm text-ink/85 leading-relaxed">
            Org-wide Evals is OFF. Re-enable in{' '}
            <Link to="/eval/settings" className="text-coral hover:underline font-medium">
              Org Settings
            </Link>{' '}
            to sample this project.
          </div>
        </section>
      )}

      {/* Card 1: Eval ingestion */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h2 className="font-serif text-lg text-ink">Eval ingestion</h2>
        <p className="text-sm text-muted mt-1">
          Turn this on to start sampling prod traffic and running the default judge bundle.
          Turning it off pauses ingestion immediately; existing data is retained.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleToggle}
            disabled={toggleDisabled}
            title={toggleDisabled ? 'Org-wide Evals is OFF' : undefined}
            role="switch"
            aria-checked={evalEnabled}
            className={
              'relative inline-flex h-7 w-12 items-center rounded-full transition-colors ' +
              (toggleDisabled ? 'opacity-50 cursor-not-allowed ' : '') +
              (evalEnabled ? 'bg-coral' : 'bg-border')
            }
          >
            <span
              className={
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' +
                (evalEnabled ? 'translate-x-6' : 'translate-x-1')
              }
            />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={
                'inline-block w-2 h-2 rounded-full ' +
                (evalEnabled && orgEvalEnabled ? 'bg-success' : 'bg-muted/50')
              }
            />
            <span className="text-ink font-medium">
              {evalEnabled ? 'ON' : 'OFF'}
            </span>
            <span className="text-muted">
              {evalEnabled
                ? orgEvalEnabled
                  ? '· Sampling traffic'
                  : '· Paused (org switch off)'
                : '· Not sampling'}
            </span>
          </div>
        </div>
      </section>

      {/* Card 2: Sampling */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h2 className="font-serif text-lg text-ink">Sampling</h2>
        <p className="text-sm text-muted mt-1">
          Judges run asynchronously within seconds of each sampled trace — no schedule needed.
          Adjust sampling rate and filters to control coverage and cost.{' '}
          <Link to="/eval/settings" className="text-coral hover:underline font-medium">
            Adjust at org level →
          </Link>
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Current sample rate</span>
            <span className="font-mono text-ink">100%</span>
          </div>
          <div className="h-2 rounded-full bg-canvas border border-border overflow-hidden">
            <div className="h-full bg-coral" style={{ width: '100%' }} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Judge spend</span>
            <span className="font-mono text-ink">$4.20 / $84.00 (5%)</span>
          </div>
          <div className="h-2 rounded-full bg-canvas border border-border overflow-hidden">
            <div className="h-full bg-success" style={{ width: '5%' }} />
          </div>
        </div>
      </section>

      {/* Card 3: Agent type — wizard output, lives at project level since each
          project chooses its own goal-specific judge bundle. */}
      <section className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg text-ink">Agent type</h2>
            <p className="text-sm text-muted mt-1">
              {agentType ? AGENT_TYPE_LABELS[agentType] : 'Not set'} · Set during onboarding. Drives
              which goal-specific judges run on this project's traces.
            </p>
          </div>
          <button
            title="Mocked in this prototype"
            className="px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded cursor-default flex-shrink-0"
          >
            Re-run wizard
          </button>
        </div>
      </section>

      {/* Card 4: Metadata schema */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h2 className="font-serif text-lg text-ink">Metadata schema</h2>
        <p className="text-sm text-muted mt-1">
          Pass these fields with every Messages call so we can group traces into sessions and
          attribute clusters to the right cohort. For Managed Agents this is wired up automatically.
        </p>
        <div className="mt-3">
          <CopyableSnippet code={SDK_SNIPPET} />
        </div>
      </section>

      {/* Card 5: Retention */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h2 className="font-serif text-lg text-ink">Retention</h2>
        <p className="text-sm text-muted mt-1">
          Trace bodies are retained for this long. Judge scores and clusters are retained
          indefinitely so historical regression baselines never expire.
        </p>
        <div className="mt-4 inline-flex p-0.5 bg-canvas border border-border rounded gap-0.5 w-fit">
          {RETENTION_OPTIONS.map((d) => {
            const selected = retentionDays === d;
            return (
              <button
                key={d}
                onClick={() => setRetentionDays(d)}
                className={
                  'px-3 py-1 text-sm rounded transition-colors ' +
                  (selected
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-muted hover:text-ink')
                }
              >
                {d} days
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-muted">
          {retentionMatchesOrg ? (
            <>Using org default.</>
          ) : (
            <>
              Using <span className="font-medium text-ink">{retentionDays} days</span> for this project.
              Org default is <span className="font-medium text-ink">{orgDefaultRetentionDays} days</span>.
            </>
          )}
        </div>
      </section>

      {/* Wizard for OFF → ON */}
      <OnboardingWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={({ agentType }) => {
          setEvalEnabled(true);
          setAgentType(agentType);
          showToast('Evals ingestion turned on');
        }}
      />

      {/* Confirm modal for ON → OFF */}
      <Modal open={confirmOffOpen} onClose={() => setConfirmOffOpen(false)} width={440} ariaLabel="Turn off Evals">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-serif text-lg text-ink">Turn off Evals?</h2>
          <button
            onClick={() => setConfirmOffOpen(false)}
            aria-label="Close"
            className="text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-ink/80 leading-relaxed">
          Data will stop ingesting immediately, but existing traces, clusters, and test sets
          remain. You can turn ingestion back on at any time.
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-chrome">
          <button
            onClick={() => setConfirmOffOpen(false)}
            className="px-3 py-1.5 text-sm text-ink/80 hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmTurnOff}
            className="px-3 py-1.5 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors"
          >
            Turn off
          </button>
        </div>
      </Modal>
    </ProjectShell>
  );
}

// Small wrapper around YamlSnippet adding a copy-to-clipboard button. Local to
// this view; we don't need the filename-header treatment here.
function CopyableSnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Non-secure contexts (e.g. some iframe embeds) can throw — silent no-op
      // is fine for a demo snippet.
    }
  }
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white relative">
      <YamlSnippet code={code} lang="bash" />
      <button
        onClick={copy}
        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-white border border-border rounded hover:bg-canvas transition-colors text-ink/80"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" /> Copied
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" /> Copy
          </>
        )}
      </button>
    </div>
  );
}
