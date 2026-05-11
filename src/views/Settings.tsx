import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { ProjectShell } from '../components/ProjectShell';
import { Modal } from '../components/Modal';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { YamlSnippet } from '../components/YamlSnippet';
import { useStore } from '../store/useStore';
import type { RetentionDays } from '../store/useStore';

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

export function Settings() {
  const evalEnabled = useStore((s) => s.evalEnabled);
  const setEvalEnabled = useStore((s) => s.setEvalEnabled);
  const setAgentType = useStore((s) => s.setAgentType);
  const retentionDays = useStore((s) => s.retentionDays);
  const setRetentionDays = useStore((s) => s.setRetentionDays);
  const showToast = useStore((s) => s.showToast);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [confirmOffOpen, setConfirmOffOpen] = useState(false);

  function handleToggle() {
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

  return (
    <ProjectShell activeTab="settings">
      <section>
        <h1 className="font-serif text-2xl text-ink">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Control ingestion, sampling, metadata, retention, and CI access for this project.
        </p>
      </section>

      {/* Card 1: Eval ingestion */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h2 className="font-serif text-lg text-ink">Eval ingestion</h2>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Turn this on to start sampling prod traffic and running the default judge bundle.
          Turning it off pauses ingestion immediately; existing data is retained.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleToggle}
            role="switch"
            aria-checked={evalEnabled}
            className={
              'relative inline-flex h-7 w-12 items-center rounded-full transition-colors ' +
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
                (evalEnabled ? 'bg-success' : 'bg-muted/50')
              }
            />
            <span className="text-ink font-medium">
              {evalEnabled ? 'ON' : 'OFF'}
            </span>
            <span className="text-muted">
              {evalEnabled ? '· Sampling traffic' : '· Not sampling'}
            </span>
          </div>
        </div>
      </section>

      {/* Card 2: Sampling */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h2 className="font-serif text-lg text-ink">Sampling</h2>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Adaptive sampling. Your project is at <span className="font-mono text-ink">100%</span>{' '}
          sampling today (low volume). As traffic grows, we automatically scale sampling down to
          keep judge cost under 5% of base API spend.
        </p>
        <div className="mt-4 flex flex-col gap-2 max-w-md">
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

      {/* Card 3: Metadata schema */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h2 className="font-serif text-lg text-ink">Metadata schema</h2>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Pass these fields with every Messages call so we can group traces into sessions and
          attribute clusters to the right cohort. For Managed Agents this is wired up automatically.
        </p>
        <div className="mt-3 max-w-2xl">
          <CopyableSnippet code={SDK_SNIPPET} />
        </div>
      </section>

      {/* Card 4: Retention */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h2 className="font-serif text-lg text-ink">Retention</h2>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Trace bodies are retained for this long. Judge scores and clusters are retained
          indefinitely so historical regression baselines never expire.
        </p>
        <div className="mt-4 flex items-center gap-2">
          {RETENTION_OPTIONS.map((d) => {
            const selected = retentionDays === d;
            return (
              <button
                key={d}
                onClick={() => setRetentionDays(d)}
                className={
                  'px-3 py-1.5 text-sm rounded border transition-colors ' +
                  (selected
                    ? 'border-coral bg-coral/5 text-ink'
                    : 'border-border bg-white text-ink/70 hover:bg-canvas')
                }
              >
                {d} days
                {d === 30 && <span className="text-xs text-muted ml-1">(default)</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* Card 5: CI tokens */}
      <section className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg text-ink">CI tokens</h2>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              Tokens authorize the GitHub Action and CLI to fetch test sets and post run results.
            </p>
          </div>
          <button
            title="Mocked in this prototype"
            className="px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded cursor-default flex-shrink-0"
          >
            Generate token
          </button>
        </div>
        <div className="mt-4 border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-chrome text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="text-left font-medium px-3 py-2">Name</th>
                <th className="text-left font-medium px-3 py-2">Created</th>
                <th className="text-left font-medium px-3 py-2">Last used</th>
                <th className="text-left font-medium px-3 py-2">Scopes</th>
                <th className="text-right font-medium px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-mono text-ink">default-prod-token</td>
                <td className="px-3 py-2 text-muted">7 days ago</td>
                <td className="px-3 py-2 text-muted">2 hours ago</td>
                <td className="px-3 py-2 text-muted font-mono text-xs">read, run</td>
                <td className="px-3 py-2 text-right">
                  <button
                    title="Mocked in this prototype"
                    className="text-xs text-coral hover:underline cursor-default"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
// this view since the larger CIIntegration version handles filename headers
// we don't need here.
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
