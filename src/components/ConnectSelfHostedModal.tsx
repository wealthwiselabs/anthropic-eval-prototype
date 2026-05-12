import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { Modal } from './Modal';
import { YamlSnippet } from './YamlSnippet';
import { JudgePill } from './JudgePill';
import { useStore } from '../store/useStore';
import type { Project } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
};

type Tab = 'python' | 'typescript' | 'curl';

const TAB_LABELS: Record<Tab, string> = {
  python: 'Python',
  typescript: 'TypeScript',
  curl: 'cURL',
};

// Map a tab to the Shiki lang YamlSnippet supports. cURL is highlighted as
// bash since Shiki has no dedicated curl grammar.
const TAB_LANG: Record<Tab, 'python' | 'typescript' | 'bash'> = {
  python: 'python',
  typescript: 'typescript',
  curl: 'bash',
};

// Builders are functions of the user-controlled project name so the
// agent_name string updates live as they type.
function buildPython(agentName: string): string {
  return `import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-4-7",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Plan a 5-day trip to Tokyo"}],
    metadata={
        "agent_name": "${agentName}",          # routes traces to this project
        "session_id": "sess_user_42",       # groups multi-turn sessions
        "user_id": "u_8a2f9b1c",            # hashed server-side
    },
)`;
}

function buildTypescript(agentName: string): string {
  return `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const message = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Plan a 5-day trip to Tokyo" }],
  metadata: {
    agent_name: "${agentName}",
    session_id: "sess_user_42",
    user_id: "u_8a2f9b1c",
  },
});`;
}

function buildCurl(agentName: string): string {
  return `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-opus-4-7",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Plan a 5-day trip to Tokyo"}],
    "metadata": {
      "agent_name": "${agentName}",
      "session_id": "sess_user_42",
      "user_id": "u_8a2f9b1c"
    }
  }'`;
}

// Trim/sanitize the project name into something safe to interpolate into a
// JSON/Python string literal. We don't escape quotes — instead we strip them,
// since project IDs shouldn't contain them anyway.
function sanitize(raw: string): string {
  return raw.replace(/["'`\\]/g, '').trim() || 'my-agent';
}

// Sanitize for the project ID/name we'll persist: lowercase, non-alphanumeric
// → hyphen, trim leading/trailing hyphens, fallback to my-agent. Stricter than
// the SDK-snippet sanitizer because this becomes the URL slug.
function sanitizeProjectId(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'my-agent';
}

type GoalJudge = 'none' | 'support' | 'code' | 'rag' | 'travel' | 'other';

// Preview labels mirror what the goal-specific judge would be named once
// created. Drives the inline preview line under the dropdown.
const GOAL_JUDGE_LABEL: Record<Exclude<GoalJudge, 'none'>, string> = {
  support: 'Support-task resolution v1.0',
  code: 'Code-task completion v1.0',
  rag: 'Retrieval-task completion v1.0',
  travel: 'Travel-task completion v1.0',
  other: 'Generic task completion v1.0',
};

export function ConnectSelfHostedModal({ open, onClose }: Props) {
  const showToast = useStore((s) => s.showToast);
  const projects = useStore((s) => s.projects);
  const addProject = useStore((s) => s.addProject);
  const [projectName, setProjectName] = useState('my-agent');
  const [tab, setTab] = useState<Tab>('python');
  const [copied, setCopied] = useState(false);
  const [goalJudge, setGoalJudge] = useState<GoalJudge>('none');
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Reset to defaults each time the modal reopens so a previous draft doesn't
  // leak across opens.
  useEffect(() => {
    if (!open) return;
    setProjectName('my-agent');
    setTab('python');
    setCopied(false);
    setGoalJudge('none');
    setDuplicateError(null);
  }, [open]);

  const safeName = useMemo(() => sanitize(projectName), [projectName]);

  const snippet = useMemo(() => {
    if (tab === 'python') return buildPython(safeName);
    if (tab === 'typescript') return buildTypescript(safeName);
    return buildCurl(safeName);
  }, [tab, safeName]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      // Brief confirmation; revert so a follow-up copy still feels responsive.
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked in some browser contexts — surface a toast
      // instead of silently failing so the user knows to copy manually.
      showToast('Copy failed — select the snippet manually.');
    }
  }

  function handleCreateProject() {
    const projectId = sanitizeProjectId(projectName);
    // Block duplicate IDs — surfaces an inline error rather than silently
    // overwriting an existing project.
    if (projects.some((p) => p.id === projectId)) {
      setDuplicateError(`Project "${projectId}" already exists.`);
      return;
    }
    const newProject: Project = {
      id: projectId,
      name: projectId,
      type: 'self-hosted',
      sessionPassRate14d: 0,
      passRateHistory: [],
      tracesSampled14d: 0,
      sessions14d: 0,
      evalCostMTD: 0,
      clusterCount: 0,
      latencyP95Ms14d: 0,
      latencyP90Ms14d: 0,
      latencyP80Ms14d: 0,
      latencyP95History: [],
      sessionCostP95: 0,
      sessionCostP90: 0,
      sessionCostP80: 0,
      sessionCostP95History: [],
    };
    addProject(newProject);
    showToast(`Project "${projectId}" created. Waiting for first trace...`);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} width={640} ariaLabel="Connect a self-hosted agent">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-border">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-lg text-ink">Connect a self-hosted agent</h2>
          <p className="text-sm text-muted">
            Add metadata to your existing Claude API calls. We'll start ingesting traces within minutes.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted hover:text-ink transition-colors shrink-0 ml-3"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* Step 1 — Project name */}
        <div className="border border-border rounded-lg p-4 flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wide text-muted">Step 1</div>
          <div className="text-sm text-ink font-medium">Project name</div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              // Editing the name should clear any prior dup error — the new
              // value may not collide.
              if (duplicateError) setDuplicateError(null);
            }}
            placeholder="my-agent"
            className="border border-border rounded px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:border-coral"
          />
          <p className="text-xs text-muted">
            This is what we'll use for <span className="font-mono">metadata.agent_name</span> and as the project ID in the URL.
          </p>
        </div>

        {/* Step 2 — Add metadata snippet */}
        <div className="border border-border rounded-lg p-4 flex flex-col gap-3">
          <div className="text-xs uppercase tracking-wide text-muted">Step 2</div>
          <div className="text-sm text-ink font-medium">Add metadata to your SDK calls</div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            {(Object.keys(TAB_LABELS) as Tab[]).map((t) => {
              const active = t === tab;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={
                    'px-3 py-1.5 text-sm transition-colors border-b-2 -mb-px ' +
                    (active
                      ? 'border-coral text-ink font-medium'
                      : 'border-transparent text-muted hover:text-ink')
                  }
                >
                  {TAB_LABELS[t]}
                </button>
              );
            })}
          </div>

          {/* Snippet + Copy */}
          <div className="relative">
            <YamlSnippet code={snippet} lang={TAB_LANG[tab]} />
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2 right-2 inline-flex items-center gap-1 bg-white border border-border rounded px-2 py-1 text-xs text-ink/80 hover:text-ink hover:border-ink/30 transition-colors"
              aria-label="Copy snippet"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-success" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-muted">
            <span className="font-mono">session_id</span> is optional but unlocks multi-turn session grouping.{' '}
            <span className="font-mono">user_id</span> is hashed server-side.
          </p>
        </div>

        {/* Step 3 — Connection status */}
        <div className="border border-border rounded-lg p-4 flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wide text-muted">Step 3</div>
          <div className="text-sm text-ink font-medium">Connection status</div>
          <div className="flex items-center gap-2">
            {/* Pulsing dot — purely cosmetic; no real polling. */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-coral opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-coral" />
            </span>
            <span className="text-sm text-ink">
              Waiting for first call from <span className="font-mono">{safeName}</span>…
            </span>
          </div>
          <p className="text-xs text-muted">
            Once we receive a trace tagged with this <span className="font-mono">agent_name</span>, the project will
            appear in your list and we'll start sampling.
          </p>
        </div>

        {/* Step 4 — LLM Judges */}
        <div className="border border-border rounded-lg p-4 flex flex-col gap-3">
          <div className="text-xs uppercase tracking-wide text-muted">Step 4</div>
          <div className="text-sm text-ink font-medium">LLM Judges</div>

          {/* a) Default bundle */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-ink/80">
              Default bundle <span className="text-muted">· Always on</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* Three Anthropic-curated default judges. Read-only cards. */}
              <div className="border border-border rounded p-2 flex flex-col gap-1 bg-chrome/40">
                <div className="text-xs font-medium text-ink leading-tight">Tool-use correctness v2.1</div>
                <div className="flex items-center gap-1">
                  <JudgePill dimension="tool-use" size="sm" />
                  <span className="text-[10px] uppercase tracking-wide text-muted bg-muted/15 px-1 py-0.5 rounded">
                    Per-turn
                  </span>
                </div>
              </div>
              <div className="border border-border rounded p-2 flex flex-col gap-1 bg-chrome/40">
                <div className="text-xs font-medium text-ink leading-tight">Safety v3.0</div>
                <div className="flex items-center gap-1">
                  <JudgePill dimension="safety" size="sm" />
                  <span className="text-[10px] uppercase tracking-wide text-muted bg-muted/15 px-1 py-0.5 rounded">
                    Per-turn
                  </span>
                </div>
              </div>
              <div className="border border-border rounded p-2 flex flex-col gap-1 bg-chrome/40">
                <div className="text-xs font-medium text-ink leading-tight">Groundedness v1.4</div>
                <div className="flex items-center gap-1">
                  <JudgePill dimension="groundedness" size="sm" />
                  <span className="text-[10px] uppercase tracking-wide text-muted bg-muted/15 px-1 py-0.5 rounded">
                    Per-turn
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted">
              These three Anthropic-curated judges run on every sampled trace by default.
            </p>
          </div>

          {/* b) Goal-specific judge (optional) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <div className="text-xs font-medium text-ink/80">Goal-specific judge (optional)</div>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">What does this agent do?</span>
              <select
                value={goalJudge}
                onChange={(e) => setGoalJudge(e.target.value as GoalJudge)}
                className="border border-border rounded px-2 py-1.5 text-sm text-ink bg-white focus:outline-none focus:border-coral"
              >
                <option value="none">None (default)</option>
                <option value="support">Support</option>
                <option value="code">Code</option>
                <option value="rag">RAG</option>
                <option value="travel">Travel</option>
                <option value="other">Other</option>
              </select>
            </label>
            {goalJudge !== 'none' && (
              <div className="text-xs text-ink bg-chrome/50 border border-border rounded px-2 py-1.5">
                We'll add: <span className="font-medium">{GOAL_JUDGE_LABEL[goalJudge]}</span> (per-session)
              </div>
            )}
            <p className="text-xs text-muted">
              Goal-specific judges score the whole session, not individual turns. You can change this later in project
              Settings.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 px-5 py-3 border-t border-border bg-chrome">
        {duplicateError && (
          <div className="text-xs text-coral bg-coral/10 border border-coral/30 rounded px-2 py-1.5">
            {duplicateError}
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-ink/80 hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateProject}
            className="px-3 py-1.5 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors"
          >
            Create project
          </button>
        </div>
      </div>
    </Modal>
  );
}
