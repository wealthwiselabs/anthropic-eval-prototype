import { useEffect, useState } from 'react';
import { X, Headphones, Code2, Database, Plane, Box } from 'lucide-react';
import { Modal } from './Modal';
import type { AgentType } from '../store/useStore';

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete: (config: { agentType: AgentType }) => void;
};

type Scope = 'all-traffic' | 'tagged-prod' | 'specific-keys';

const SCOPE_OPTIONS: { value: Scope; label: string; sublabel: string }[] = [
  {
    value: 'all-traffic',
    label: 'All traffic from this Managed Agent',
    sublabel: 'Recommended. Anthropic samples adaptively to keep cost low.',
  },
  {
    value: 'tagged-prod',
    label: 'API keys tagged `prod`',
    sublabel: 'Limit ingestion to keys you have explicitly marked production.',
  },
  {
    value: 'specific-keys',
    label: 'Specific API keys (pick later)',
    sublabel: 'Fine-grained control. You can edit the list after setup.',
  },
];

const AGENT_TYPES: {
  value: AgentType;
  label: string;
  description: string;
  Icon: typeof Headphones;
}[] = [
  { value: 'support', label: 'Support', description: 'Customer questions, ticket triage, knowledge lookup', Icon: Headphones },
  { value: 'code', label: 'Code', description: 'Coding assistant, code review, refactor suggestions', Icon: Code2 },
  { value: 'rag', label: 'RAG', description: 'Document Q&A, retrieval-augmented chat over your data', Icon: Database },
  { value: 'travel', label: 'Travel', description: 'Trip planning, booking, recommendations', Icon: Plane },
  { value: 'other', label: 'Other', description: 'Custom workflow — default bundle only, no goal judge', Icon: Box },
];

// 3-step modal wizard for turning Evals on. Local state only; the parent
// flips evalEnabled / agentType in the store on completion (see Settings).
export function OnboardingWizard({ open, onClose, onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [scope, setScope] = useState<Scope>('all-traffic');
  const [agentType, setAgentType] = useState<AgentType>('travel');

  // Reset whenever the wizard reopens so each invocation starts at step 1.
  // Mirrors the same pattern used in SaveAsTestSetModal; the React Compiler
  // lint flags setState-in-effect, but the alternative (key-based remount)
  // would force the parent to manage instance identity for every wizard usage.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(1);
    setScope('all-traffic');
    setAgentType('travel');
  }, [open]);

  const scopeLabel = SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? '';
  const agentLabel = AGENT_TYPES.find((a) => a.value === agentType)?.label ?? '';

  return (
    <Modal open={open} onClose={onClose} width={600} ariaLabel="Turn on Evals">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-lg text-ink">
            {step === 1 && 'Turn on Evals for this project'}
            {step === 2 && 'What kind of agent is this?'}
            {step === 3 && "You're ready to instrument"}
          </h2>
          <span className="text-[10px] uppercase tracking-wide text-muted">Step {step} of 3</span>
        </div>
        <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink/80 leading-relaxed">
              When Evals is on, Anthropic samples prod traffic, runs the default judge bundle
              (Tool-use, Safety, Groundedness) on every sampled trace, and surfaces emerging
              failure clusters here. Each judge returns <span className="font-medium">PASS</span>{' '}
              or <span className="font-medium">FAIL</span>; a trace passes only if every active
              judge returns PASS. No code change required for Managed Agents.
            </p>
            <div className="flex flex-col gap-2">
              {SCOPE_OPTIONS.map((opt) => {
                const selected = scope === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={
                      'flex items-start gap-3 px-3 py-3 border rounded-md cursor-pointer transition-colors ' +
                      (selected ? 'border-coral bg-coral/5' : 'border-border hover:bg-canvas')
                    }
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={selected}
                      onChange={() => setScope(opt.value)}
                      className="mt-0.5 accent-coral"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink">{opt.label}</div>
                      <div className="text-xs text-muted mt-0.5">{opt.sublabel}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink/80 leading-relaxed">
              Pick the agent's primary goal. A goal-specific judge is added on top of the default
              bundle so we can score task completion, not just per-turn behavior.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {AGENT_TYPES.map((a) => {
                const selected = agentType === a.value;
                const Icon = a.Icon;
                return (
                  <button
                    key={a.value}
                    onClick={() => setAgentType(a.value)}
                    className={
                      'text-left p-3 border rounded-md transition-colors ' +
                      (selected ? 'border-coral bg-coral/5' : 'border-border hover:bg-canvas')
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-ink/80" />
                      <span className="text-sm font-medium text-ink">{a.label}</span>
                    </div>
                    <div className="text-xs text-muted mt-1.5 leading-snug">{a.description}</div>
                  </button>
                );
              })}
              {/* Pad the grid so the last row aligns visually (2×3 layout) */}
              <div aria-hidden className="hidden" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="border border-border rounded-md bg-canvas/40 px-4 py-3 text-sm text-ink leading-relaxed">
              <div className="grid grid-cols-[120px_1fr] gap-y-1.5 gap-x-3">
                <span className="text-muted">Scope</span>
                <span>{scopeLabel}</span>
                <span className="text-muted">Agent type</span>
                <span>{agentLabel}</span>
                <span className="text-muted">Default bundle</span>
                <span>Tool-use, Safety, Groundedness</span>
                <span className="text-muted">Goal-specific</span>
                <span>
                  {agentType === 'other'
                    ? 'None (custom workflow)'
                    : `+1 judge: ${agentLabel}-task completion`}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted">
              Default bundle (3 per-turn judges)
              {agentType === 'other' ? '' : ' + 1 per-session goal-specific judge'} will run on every
              sampled session. Per-turn judges score each trace; the per-session judge scores the
              whole conversation. A session <span className="font-medium">passes</span> only if every
              session-level judge AND every turn's per-turn judges return PASS. We'll start showing
              data within ~15 minutes; scope, retention, and judges are editable in Settings.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border bg-chrome">
        <button
          onClick={step === 1 ? onClose : () => setStep((s) => (s === 3 ? 2 : 1))}
          className="px-3 py-1.5 text-sm text-ink/80 hover:text-ink transition-colors"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
            className="px-3 py-1.5 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={() => {
              onComplete({ agentType });
              onClose();
            }}
            className="px-3 py-1.5 text-sm bg-coral text-white rounded hover:bg-coral/90 transition-colors"
          >
            Turn on Evals
          </button>
        )}
      </div>
    </Modal>
  );
}
