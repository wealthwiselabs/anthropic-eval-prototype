import { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { KPITile } from '../components/KPITile';
import { useStore } from '../store/useStore';
import type { RetentionDays } from '../store/useStore';

const RETENTION_OPTIONS: RetentionDays[] = [30, 90, 180];

// Org-level settings: master kill switch, default sampling policy, default
// retention, CI tokens (moved here from project Settings), data policy, and
// org-wide eval billing. The wizard does NOT fire here — that's a project-
// level concern. Flipping the org switch only opens a small confirm modal.
export function OrgSettings() {
  const orgEvalEnabled = useStore((s) => s.orgEvalEnabled);
  const setOrgEvalEnabled = useStore((s) => s.setOrgEvalEnabled);
  const orgDefaultRetentionDays = useStore((s) => s.orgDefaultRetentionDays);
  const setOrgDefaultRetentionDays = useStore((s) => s.setOrgDefaultRetentionDays);
  const showToast = useStore((s) => s.showToast);

  const [confirmOnOpen, setConfirmOnOpen] = useState(false);
  const [confirmOffOpen, setConfirmOffOpen] = useState(false);

  function handleToggle() {
    if (orgEvalEnabled) setConfirmOffOpen(true);
    else setConfirmOnOpen(true);
  }

  function confirmTurnOn() {
    setOrgEvalEnabled(true);
    setConfirmOnOpen(false);
    showToast('Org-wide Evals turned on');
  }

  function confirmTurnOff() {
    setOrgEvalEnabled(false);
    setConfirmOffOpen(false);
    showToast('Org-wide Evals turned off');
  }

  return (
    <div className="p-8 max-w-[1280px] w-full mx-auto flex flex-col gap-6">
      <section>
        <h1 className="font-serif text-2xl text-ink">Org settings</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Org-wide controls for Evals: master kill switch, default policies, CI tokens, and billing.
        </p>
      </section>

      {/* Card 1: Evals platform — master kill switch */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h2 className="font-serif text-lg text-ink">Evals platform</h2>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Master switch for the entire org. When off, no project samples traffic — existing data is retained.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleToggle}
            role="switch"
            aria-checked={orgEvalEnabled}
            className={
              'relative inline-flex h-7 w-12 items-center rounded-full transition-colors ' +
              (orgEvalEnabled ? 'bg-coral' : 'bg-border')
            }
          >
            <span
              className={
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' +
                (orgEvalEnabled ? 'translate-x-6' : 'translate-x-1')
              }
            />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={
                'inline-block w-2 h-2 rounded-full ' +
                (orgEvalEnabled ? 'bg-success' : 'bg-muted/50')
              }
            />
            <span className="text-ink font-medium">{orgEvalEnabled ? 'ON' : 'OFF'}</span>
            <span className="text-muted">
              {orgEvalEnabled ? '· All projects enabled' : '· No traffic sampled (kill switch)'}
            </span>
          </div>
        </div>
      </section>

      {/* Card 2: Default sampling policy */}
      <section className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg text-ink">Default sampling policy</h2>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              Adaptive. We auto-tune sample rate per project to keep judge cost under{' '}
              <span className="font-medium text-ink">5% of API spend</span>. Low-volume projects sample at 100%.
            </p>
          </div>
          <button
            title="Mocked in this prototype"
            className="px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded cursor-default flex-shrink-0"
          >
            Adjust
          </button>
        </div>
      </section>

      {/* Card 3: Default retention */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h2 className="font-serif text-lg text-ink">Default retention</h2>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Trace bodies retention default for new projects. Projects can override this per-project.
        </p>
        <div className="mt-4 flex items-center gap-2">
          {RETENTION_OPTIONS.map((d) => {
            const selected = orgDefaultRetentionDays === d;
            return (
              <button
                key={d}
                onClick={() => setOrgDefaultRetentionDays(d)}
                className={
                  'px-3 py-1.5 text-sm rounded border transition-colors ' +
                  (selected
                    ? 'border-coral bg-coral/5 text-ink'
                    : 'border-border bg-white text-ink/70 hover:bg-canvas')
                }
              >
                {d} days
              </button>
            );
          })}
        </div>
      </section>

      {/* Card 4: CI tokens (moved from project Settings) */}
      <section className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg text-ink">CI tokens</h2>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              Org-wide tokens that authorize the GitHub Action and CLI to fetch test sets and post run results.
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
                <td className="px-3 py-2 text-muted">12 days ago</td>
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

      {/* Card 5: Data policy */}
      <section className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg text-ink">Data policy</h2>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              How we handle trace data on your behalf.
            </p>
          </div>
          <button
            title="Mocked in this prototype"
            className="text-sm text-coral hover:underline cursor-default flex-shrink-0"
          >
            View full policy
          </button>
        </div>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-ink/80 list-disc pl-5">
          <li><span className="font-mono">user_id</span> is hashed server-side before storage</li>
          <li>Prompts and completions encrypted at rest</li>
          <li>PII redaction available (request access)</li>
          <li>Right-to-delete API: per-trace, per-session, or per-project, propagates within 24h</li>
        </ul>
      </section>

      {/* Card 6: Eval billing */}
      <section className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg text-ink">Eval billing</h2>
            <p className="text-sm text-muted mt-1 max-w-2xl">
              Org-wide judge spend rolls up across projects. Capped by the default sampling policy.
            </p>
          </div>
          <button
            title="Mocked in this prototype"
            className="px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded cursor-default flex-shrink-0"
          >
            View invoice
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 max-w-xl">
          <KPITile label="Eval cost MTD (all projects)" value="$4.20" sublabel="May 1 → today" />
          <KPITile label="vs. API spend" value="5%" sublabel="under 5% policy cap" />
        </div>
      </section>

      {/* Confirm modal — OFF → ON */}
      <Modal open={confirmOnOpen} onClose={() => setConfirmOnOpen(false)} width={440} ariaLabel="Turn on org Evals">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-serif text-lg text-ink">Turn Evals on for the org?</h2>
          <button
            onClick={() => setConfirmOnOpen(false)}
            aria-label="Close"
            className="text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-ink/80 leading-relaxed">
          Existing projects will resume sampling immediately. Per-project toggles are preserved.
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-chrome">
          <button
            onClick={() => setConfirmOnOpen(false)}
            className="px-3 py-1.5 text-sm text-ink/80 hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmTurnOn}
            className="px-3 py-1.5 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors"
          >
            Confirm
          </button>
        </div>
      </Modal>

      {/* Confirm modal — ON → OFF */}
      <Modal open={confirmOffOpen} onClose={() => setConfirmOffOpen(false)} width={440} ariaLabel="Turn off org Evals">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-serif text-lg text-ink">Turn off Evals for the entire org?</h2>
          <button
            onClick={() => setConfirmOffOpen(false)}
            aria-label="Close"
            className="text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-ink/80 leading-relaxed">
          All project ingestion pauses. Existing data is retained and can be re-enabled at any time.
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
    </div>
  );
}
