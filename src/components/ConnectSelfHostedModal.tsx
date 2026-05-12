import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { Modal } from './Modal';
import { YamlSnippet } from './YamlSnippet';
import { useStore } from '../store/useStore';

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

export function ConnectSelfHostedModal({ open, onClose }: Props) {
  const showToast = useStore((s) => s.showToast);
  const [projectName, setProjectName] = useState('my-agent');
  const [tab, setTab] = useState<Tab>('python');
  const [copied, setCopied] = useState(false);

  // Reset to defaults each time the modal reopens so a previous draft doesn't
  // leak across opens.
  useEffect(() => {
    if (!open) return;
    setProjectName('my-agent');
    setTab('python');
    setCopied(false);
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

  function handleCheckForTraces() {
    showToast(`Still waiting for first call from "${safeName}"`);
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
            onChange={(e) => setProjectName(e.target.value)}
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
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-chrome">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-ink/80 hover:text-ink transition-colors"
        >
          I'll do this later
        </button>
        <button
          onClick={handleCheckForTraces}
          title="Mocked in this prototype"
          className="px-3 py-1.5 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors"
        >
          I've added it — check for traces
        </button>
      </div>
    </Modal>
  );
}
